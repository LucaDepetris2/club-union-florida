require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const News = require('./models/News');
const Player = require('./models/Player');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'todocuf';

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.cloudinary.com", "https://formspree.io"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      frameSrc: ["'self'", "https://www.google.com", "https://maps.google.com"],
      childSrc: ["'self'", "https://www.google.com", "https://maps.google.com"]
    }
  }
}));

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ------- Cloudinary opcional si hay credencial (backend firmado) -------
let cloudinary = null;
if (process.env.CLOUDINARY_URL) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({ secure: true });
}
async function maybeUploadToCloudinary(base64) {
  if (!cloudinary || !base64 || !base64.startsWith('data:')) return base64;
  const res = await cloudinary.uploader.upload(base64, {
    folder: 'cuf',
    resource_type: 'image',
    transformation: [{ width: 1600, crop: 'limit', fetch_format: 'auto', quality: 'auto' }]
  });
  return res.secure_url;
}
// ----------------------------------------------------------------------

// Rate limit básico a /api
app.use('/api', rateLimit({ windowMs: 60_000, max: 300 }));

// Login simple
app.post('/api/login', (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) return res.json({ success: true });
  res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});

// Helper para exponer id
const mapId = d => (d ? ({ ...d, id: d._id }) : d);

// ============ NEWS ============
app.get('/api/news', async (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const items = await News.find().sort({ date: -1, createdAt: -1 }).skip(skip).limit(Number(limit)).lean();
  res.json(items.map(mapId));
});

app.get('/api/news/:id', async (req, res) => {
  const item = await News.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(mapId(item));
});

app.post('/api/news', async (req, res) => {
  const payload = { ...req.body };
  if (payload.image) payload.image = await maybeUploadToCloudinary(payload.image);
  const doc = await News.create(payload);
  res.status(201).json({ id: doc._id });
});

app.put('/api/news/:id', async (req, res) => {
  const payload = { ...req.body };
  if (payload.image && payload.image.startsWith('data:')) {
    payload.image = await maybeUploadToCloudinary(payload.image);
  }
  const updated = await News.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.delete('/api/news/:id', async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// ============ PLAYERS ============
app.get('/api/players', async (_req, res) => {
  const items = await Player.find().sort({ name: 1 }).lean();
  res.json(items.map(mapId));
});

app.get('/api/players/:id', async (req, res) => {
  const item = await Player.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(mapId(item));
});

app.post('/api/players', async (req, res) => {
  const payload = { ...req.body };
  if (payload.image) payload.image = await maybeUploadToCloudinary(payload.image);
  const doc = await Player.create(payload);
  res.status(201).json({ id: doc._id });
});

app.put('/api/players/:id', async (req, res) => {
  const payload = { ...req.body };
  if (payload.image && payload.image.startsWith('data:')) {
    payload.image = await maybeUploadToCloudinary(payload.image);
  }
  const updated = await Player.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.delete('/api/players/:id', async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).end();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --------- Guardas de entorno + conexión Mongo ---------
function must(k) {
  const v = process.env[k];
  if (!v) {
    console.error(`FATAL: falta ${k}. Presentes:`,
      Object.keys(process.env).filter(x => x.includes('MONGO') || x === 'PORT'));
    process.exit(1);
  }
  return v;
}

const MONGODB_URI = must('MONGODB_URI');

mongoose.connect(MONGODB_URI)
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`Servidor ON http://0.0.0.0:${PORT}`)))
  .catch(err => { console.error('Error MongoDB:', err); process.exit(1); });
