const express = require('express');
const path = require('path');
const fs = require('fs');
const jsonServer = require('json-server');
const bcrypt = require('bcryptjs');

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

// ✅ Hash directo de "todocuf" (válido y comprobado)
const ADMIN_PASSWORD_HASH = '$2a$10$9M/rGxGmZvjBJ9Ul6VGLKOlNHZ8O0DjdHi6HNSb7jcnJFGf.6bi/2';

app.post('/api/login', async (req, res) => {
  const { password } = req.body;

  console.log('\n/////////////////////////////////////////////');
  console.log('🔐 Contraseña ingresada:', JSON.stringify(password));
  console.log('🧂 Hash embebido:', ADMIN_PASSWORD_HASH);

  const expected = 'todocuf';
  console.log('🔎 Igual texto plano?', password === expected);

  try {
    const match = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    console.log('✅ Coincide con bcrypt:', match);

    if (match) {
      return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Contraseña incorrecta' });
  } catch (error) {
    console.error('❌ Error al comparar hashes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
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




