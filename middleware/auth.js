const jwt = require('jsonwebtoken');

// Verifica token JWT
function verificarToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'Token requerido' });

  const token = header.split(' ')[1]; // Bearer <token>
  if (!token) return res.status(401).json({ error: 'Formato inválido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lms_secret_key');
    req.usuario = decoded; // { id, email, rol }
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

// Solo admins
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin')
    return res.status(403).json({ error: 'Acceso restringido a administradores' });
  next();
}

// Solo estudiantes
function soloEstudiante(req, res, next) {
  if (req.usuario?.rol !== 'estudiante')
    return res.status(403).json({ error: 'Acceso restringido a estudiantes' });
  next();
}

module.exports = { verificarToken, soloAdmin, soloEstudiante };
