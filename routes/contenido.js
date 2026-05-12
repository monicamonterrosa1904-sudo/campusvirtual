const router = require('express').Router();
const pool   = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// ──────────────────────────────────────────
// GRABACIONES (página de inicio del curso)
// ──────────────────────────────────────────

// GET /api/contenido/grabaciones?curso_id=X
router.get('/grabaciones', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
    const { rows } = await pool.query(
      'SELECT * FROM grabaciones WHERE curso_id=$1 ORDER BY creado_en DESC',
      [curso_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/contenido/grabaciones (admin)
router.post('/grabaciones', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { curso_id, titulo, url, descripcion } = req.body;
    if (!curso_id || !titulo || !url)
      return res.status(400).json({ error: 'curso_id, título y url requeridos' });
    const { rows } = await pool.query(
      'INSERT INTO grabaciones (curso_id, titulo, url, descripcion) VALUES ($1,$2,$3,$4) RETURNING *',
      [curso_id, titulo, url, descripcion]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/contenido/grabaciones/:id (admin)
router.delete('/grabaciones/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM grabaciones WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Grabación eliminada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// ──────────────────────────────────────────
// INSTRUCTIVOS
// ──────────────────────────────────────────

// GET /api/contenido/instructivos?curso_id=X
router.get('/instructivos', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
    const { rows } = await pool.query(
      'SELECT * FROM instructivos WHERE curso_id=$1 ORDER BY creado_en ASC',
      [curso_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/contenido/instructivos (admin)
router.post('/instructivos', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { curso_id, titulo, contenido, archivo_url } = req.body;
    if (!curso_id || !titulo)
      return res.status(400).json({ error: 'curso_id y título requeridos' });
    const { rows } = await pool.query(
      'INSERT INTO instructivos (curso_id, titulo, contenido, archivo_url) VALUES ($1,$2,$3,$4) RETURNING *',
      [curso_id, titulo, contenido, archivo_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/contenido/instructivos/:id (admin)
router.put('/instructivos/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { titulo, contenido, archivo_url } = req.body;
    const { rows } = await pool.query(
      `UPDATE instructivos SET titulo=COALESCE($1,titulo), contenido=COALESCE($2,contenido),
       archivo_url=COALESCE($3,archivo_url) WHERE id=$4 RETURNING *`,
      [titulo, contenido, archivo_url, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Instructivo no encontrado' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/contenido/instructivos/:id (admin)
router.delete('/instructivos/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM instructivos WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Instructivo eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
