const router = require('express').Router();
const pool   = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/foros?curso_id=X
router.get('/', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
    const { rows } = await pool.query(
      `SELECT f.*, u.nombre AS autor_nombre,
        (SELECT COUNT(*) FROM foro_mensajes m WHERE m.foro_id = f.id) AS total_mensajes
       FROM foros f LEFT JOIN usuarios u ON u.id = f.autor_id
       WHERE f.curso_id=$1 ORDER BY f.creado_en DESC`,
      [curso_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/foros/:id — foro con mensajes
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { rows: [foro] } = await pool.query(
      `SELECT f.*, u.nombre AS autor_nombre FROM foros f
       LEFT JOIN usuarios u ON u.id = f.autor_id WHERE f.id=$1`,
      [req.params.id]
    );
    if (!foro) return res.status(404).json({ error: 'Foro no encontrado' });
    const { rows: mensajes } = await pool.query(
      `SELECT m.*, u.nombre AS autor_nombre, u.avatar_url AS autor_avatar
       FROM foro_mensajes m LEFT JOIN usuarios u ON u.id = m.autor_id
       WHERE m.foro_id=$1 ORDER BY m.creado_en ASC`,
      [req.params.id]
    );
    res.json({ ...foro, mensajes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/foros — crear foro (admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { curso_id, titulo, descripcion } = req.body;
    if (!curso_id || !titulo) return res.status(400).json({ error: 'curso_id y título requeridos' });
    const { rows } = await pool.query(
      'INSERT INTO foros (curso_id, titulo, descripcion, autor_id) VALUES ($1,$2,$3,$4) RETURNING *',
      [curso_id, titulo, descripcion, req.usuario.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/foros/:id (admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM foros WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Foro eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/foros/:id/mensajes — responder en foro (cualquier usuario inscrito)
router.post('/:id/mensajes', verificarToken, async (req, res) => {
  try {
    const { mensaje } = req.body;
    if (!mensaje) return res.status(400).json({ error: 'Mensaje requerido' });
    const { rows } = await pool.query(
      'INSERT INTO foro_mensajes (foro_id, autor_id, mensaje) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, req.usuario.id, mensaje]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/foros/mensajes/:mensajeId (admin o autor)
router.delete('/mensajes/:mensajeId', verificarToken, async (req, res) => {
  try {
    const { rows: [msg] } = await pool.query(
      'SELECT * FROM foro_mensajes WHERE id=$1', [req.params.mensajeId]
    );
    if (!msg) return res.status(404).json({ error: 'Mensaje no encontrado' });
    if (req.usuario.rol !== 'admin' && msg.autor_id !== req.usuario.id)
      return res.status(403).json({ error: 'Sin permiso' });
    await pool.query('DELETE FROM foro_mensajes WHERE id=$1', [req.params.mensajeId]);
    res.json({ mensaje: 'Mensaje eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
