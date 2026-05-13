const router = require('express').Router();
const pool   = require('../db/pool');
const path   = require('path');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// ──────────────────────────────────────────
// TAREAS
// ──────────────────────────────────────────

// GET /api/tareas?curso_id=X
router.get('/', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
    const { rows } = await pool.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM entregas e WHERE e.tarea_id = t.id) AS total_entregas
       FROM tareas t WHERE t.curso_id=$1 ORDER BY t.creado_en DESC`,
      [curso_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/tareas/:id
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { rows: [tarea] } = await pool.query('SELECT * FROM tareas WHERE id=$1', [req.params.id]);
    if (!tarea) return res.status(404).json({ error: 'Tarea no encontrada' });

    // Si es estudiante, busca su entrega
    let miEntrega = null;
    if (req.usuario.rol === 'estudiante') {
      const { rows } = await pool.query(
        'SELECT * FROM entregas WHERE tarea_id=$1 AND estudiante_id=$2',
        [req.params.id, req.usuario.id]
      );
      miEntrega = rows[0] || null;
    }

    // Si es admin, trae todas las entregas con calificaciones
    let entregas = [];
    if (req.usuario.rol === 'admin') {
      const { rows } = await pool.query(
        `SELECT e.*, u.nombre AS estudiante_nombre, c.puntaje, c.comentario AS comentario_calificacion
         FROM entregas e
         JOIN usuarios u ON u.id = e.estudiante_id
         LEFT JOIN calificaciones c ON c.entrega_id = e.id
         WHERE e.tarea_id=$1 ORDER BY e.entregado_en DESC`,
        [req.params.id]
      );
      entregas = rows;
    }

    res.json({ ...tarea, mi_entrega: miEntrega, entregas });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/tareas — crear tarea (admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { curso_id, titulo, descripcion, fecha_limite, puntaje_max } = req.body;
    if (!curso_id || !titulo) return res.status(400).json({ error: 'curso_id y título requeridos' });
    const { rows } = await pool.query(
      `INSERT INTO tareas (curso_id, titulo, descripcion, fecha_limite, puntaje_max)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [curso_id, titulo, descripcion, fecha_limite || null, puntaje_max || 100]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/tareas/:id (admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, fecha_limite, puntaje_max } = req.body;
    const { rows } = await pool.query(
      `UPDATE tareas SET titulo=COALESCE($1,titulo), descripcion=COALESCE($2,descripcion),
       fecha_limite=COALESCE($3,fecha_limite), puntaje_max=COALESCE($4,puntaje_max)
       WHERE id=$5 RETURNING *`,
      [titulo, descripcion, fecha_limite, puntaje_max, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Tarea no encontrada' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/tareas/:id (admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tareas WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Tarea eliminada' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// ──────────────────────────────────────────
// ENTREGAS
// ──────────────────────────────────────────

// POST /api/tareas/:id/entregar — estudiante entrega tarea
router.post('/:id/entregar', verificarToken, upload.single('archivo'), async (req, res) => {
  try {
    const { comentario } = req.body;
    const archivoUrl = req.file ? req.file.path : null;

    const { rows } = await pool.query(
      `INSERT INTO entregas (tarea_id, estudiante_id, comentario, archivo_url)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (tarea_id, estudiante_id)
       DO UPDATE SET comentario=$3, archivo_url=COALESCE($4, entregas.archivo_url), entregado_en=NOW()
       RETURNING *`,
      [req.params.id, req.usuario.id, comentario, archivoUrl]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// ──────────────────────────────────────────
// CALIFICACIONES
// ──────────────────────────────────────────

// POST /api/tareas/entregas/:entregaId/calificar (admin)
router.post('/entregas/:entregaId/calificar', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { puntaje, comentario } = req.body;
    if (puntaje === undefined) return res.status(400).json({ error: 'Puntaje requerido' });
    const { rows } = await pool.query(
      `INSERT INTO calificaciones (entrega_id, calificador_id, puntaje, comentario)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (entrega_id)
       DO UPDATE SET puntaje=$3, comentario=$4, calificado_en=NOW()
       RETURNING *`,
      [req.params.entregaId, req.usuario.id, puntaje, comentario]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/tareas/calificaciones/mis-notas?curso_id=X (estudiante)
router.get('/calificaciones/mis-notas', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    const { rows } = await pool.query(
      `SELECT t.titulo AS tarea, t.puntaje_max, e.entregado_en,
              c.puntaje, c.comentario AS retroalimentacion, c.calificado_en
       FROM entregas e
       JOIN tareas t ON t.id = e.tarea_id
       LEFT JOIN calificaciones c ON c.entrega_id = e.id
       WHERE e.estudiante_id=$1 ${curso_id ? 'AND t.curso_id=$2' : ''}
       ORDER BY t.creado_en DESC`,
      curso_id ? [req.usuario.id, curso_id] : [req.usuario.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
