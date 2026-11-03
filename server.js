require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
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

// ============ AUTH ============
if (!process.env.ADMIN_PASSWORD) {
  console.warn('WARN: falta ADMIN_PASSWORD, usando la contraseña por defecto. Configurala en el hosting.');
}

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 h
const TOKEN_SECRET = process.env.TOKEN_SECRET
  || crypto.createHash('sha256').update(`cuf-token:${ADMIN_PASSWORD}`).digest('hex');

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest();
const sign = data => crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');

function createToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && Date.now() < exp;
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (verifyToken(token)) return next();
  res.status(401).json({ error: 'No autorizado' });
}

// Rate limit estricto al login para frenar fuerza bruta
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Demasiados intentos, probá en unos minutos' }
});

app.post('/api/login', loginLimiter, (req, res) => {
  const { password } = req.body || {};
  // Comparar hashes de igual largo en tiempo constante
  if (typeof password === 'string' && crypto.timingSafeEqual(sha256(password), sha256(ADMIN_PASSWORD))) {
    return res.json({ success: true, token: createToken() });
  }
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

app.post('/api/news', requireAdmin, async (req, res) => {
  const payload = { ...req.body };
  if (payload.image) payload.image = await maybeUploadToCloudinary(payload.image);
  const doc = await News.create(payload);
  res.status(201).json({ id: doc._id });
});

app.put('/api/news/:id', requireAdmin, async (req, res) => {
  const payload = { ...req.body };
  if (payload.image && payload.image.startsWith('data:')) {
    payload.image = await maybeUploadToCloudinary(payload.image);
  }
  const updated = await News.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.delete('/api/news/:id', requireAdmin, async (req, res) => {
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

app.post('/api/players', requireAdmin, async (req, res) => {
  const payload = { ...req.body };
  if (payload.image) payload.image = await maybeUploadToCloudinary(payload.image);
  const doc = await Player.create(payload);
  res.status(201).json({ id: doc._id });
});

app.put('/api/players/:id', requireAdmin, async (req, res) => {
  const payload = { ...req.body };
  if (payload.image && payload.image.startsWith('data:')) {
    payload.image = await maybeUploadToCloudinary(payload.image);
  }
  const updated = await Player.findByIdAndUpdate(req.params.id, payload, { new: true }).lean();
  if (!updated) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

app.delete('/api/players/:id', requireAdmin, async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

// SSR Handler function (will be populated after build)
async function startAstroServer() {
  const { handler } = await import('./frontend/dist/server/entry.mjs');
  app.use(handler);

  // 404 para API si no capturó nada antes
  app.use('/api/*', (req, res) => res.status(404).json({ error: 'Not found' }));
}

// Start server
const startServer = async () => {
  let uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'test') {
    // ... (test logic)
  } else {
    if (!uri) {
      console.error('FATAL: falta MONGODB_URI');
      process.exit(1);
    }
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // Serve static assets primarily (client-side hydration)
    app.use(express.static(path.join(__dirname, 'public')));
    // Also serve client assets from dist/client if needed (redundant usually if copied to public, but good for safety)
    app.use(express.static(path.join(__dirname, 'frontend/dist/client')));

    // Initialize Astro Middleware
    if (process.env.NODE_ENV !== 'test') {
      await startAstroServer().catch(err => {
        console.error("Failed to load Astro middleware (did you run 'npm run build'?):", err);
      });
    }

    app.listen(PORT, '0.0.0.0', () => console.log(`Servidor ON http://0.0.0.0:${PORT}`));
  } catch (err) {
    console.error('Error MongoDB:', err);
    process.exit(1);
  }
};

startServer();
