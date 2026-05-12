const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db/pool');

const SECRET = process.env.JWT_SECRET || 'lms_secret_key';

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });

    const rolFinal = ['admin','estudiante'].includes(rol) ? rol : 'estudiante';
    const hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol)
       VALUES ($1,$2,$3,$4) RETURNING id, nombre, email, rol`,
      [nombre, email, hash, rolFinal]
    );
    res.status(201).json({ mensaje: 'Usuario creado', usuario: rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'El email ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE email=$1 AND activo=TRUE', [email]
    );
    if (!rows.length)
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const usuario = rows[0];
    const ok = await bcrypt.compare(password, usuario.password);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
      SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, avatar_url: usuario.avatar_url }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

// GET /api/auth/perfil  (token requerido)
router.get('/perfil', require('../middleware/auth').verificarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email, rol, avatar_url, creado_en FROM usuarios WHERE id=$1',
      [req.usuario.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  }
});

module.exports = router;
