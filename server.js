require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app = express();

// ── Middlewares ───────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos subidos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Servir el frontend (HTML estático)
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/cursos',    require('./routes/cursos'));
app.use('/api/modulos',   require('./routes/modulos'));
app.use('/api/foros',     require('./routes/foros'));
app.use('/api/tareas',    require('./routes/tareas'));
app.use('/api/contenido', require('./routes/contenido'));

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ── Cualquier otra ruta → index.html ─────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CampusVirtual corriendo en puerto ${PORT}`);
});
