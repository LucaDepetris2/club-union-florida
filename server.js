const express = require('express');
const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');

const app = express();
const dbPath = '/persistent/db.json'; // Ruta al disco persistente

// ✅ Crear db.json si no existe
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ news: [], players: [] }, null, 2));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const router = jsonServer.router(dbPath);
const middlewares = jsonServer.defaults();

const PORT = process.env.PORT || 3000;

// ✅ Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Leer contraseña desde variable de entorno
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'todocuf'; // fallback para testing local

app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }

  res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
});

app.use('/api', middlewares, router);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
});

server.keepAliveTimeout = 120000;
server.headersTimeout = 120000;




