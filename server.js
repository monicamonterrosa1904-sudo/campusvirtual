require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/cursos', require('./routes/cursos'));
app.use('/api/modulos', require('./routes/modulos'));
app.use('/api/foros', require('./routes/foros'));
app.use('/api/tareas', require('./routes/tareas'));
app.use('/api/contenido', require('./routes/contenido'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 CampusVirtual corriendo en puerto ${PORT}`));
