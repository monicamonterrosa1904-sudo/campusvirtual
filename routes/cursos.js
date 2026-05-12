const router = require('express').Router();
const pool   = require('../db/pool');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/cursos — lista todos (admin ve todos, estudiante ve sus inscritos)
router.get('/', verificarToken, async (req, res) => {
  try {
    let rows;
    if (req.usuario.rol === 'admin') {
      ({ rows } = await pool.query(
        `SELECT c.*, u.nombre AS instructor_nombre
         FROM cursos c
         LEFT JOIN usuarios u ON u.id = c.instructor_id
         ORDER BY c.creado_en DESC`
      ));
    } else {
      ({ rows } = await pool.query(
        `SELECT c.*, u.nombre AS instructor_nombre
         FROM cursos c
         LEFT JOIN usuarios u ON u.id = c.instructor_id
         JOIN inscripciones i ON i.curso_id = c.id AND i.estudiante_id = $1
         WHERE c.estado = 'activo'
         ORDER BY c.creado_en DESC`,
        [req.usuario.id]
      ));
    }
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/cursos/:id — detalle de un curso
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, u.nombre AS instructor_nombre, u.avatar_url AS instructor_avatar
       FROM cursos c LEFT JOIN usuarios u ON u.id = c.instructor_id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/cursos — crear curso (solo admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, imagen_url, estado } = req.body;
    if (!titulo) return res.status(400).json({ error: 'Título requerido' });
    const { rows } = await pool.query(
      `INSERT INTO cursos (titulo, descripcion, instructor_id, imagen_url, estado)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [titulo, descripcion, req.usuario.id, imagen_url, estado || 'borrador']
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/cursos/:id — editar curso (solo admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, imagen_url, estado } = req.body;
    const { rows } = await pool.query(
      `UPDATE cursos SET titulo=COALESCE($1,titulo), descripcion=COALESCE($2,descripcion),
       imagen_url=COALESCE($3,imagen_url), estado=COALESCE($4,estado)
       WHERE id=$5 RETURNING *`,
      [titulo, descripcion, imagen_url, estado, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Curso no encontrado' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/cursos/:id (solo admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM cursos WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Curso eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/cursos/:id/inscribir — inscribir estudiante
router.post('/:id/inscribir', verificarToken, async (req, res) => {
  try {
    const estudianteId = req.usuario.rol === 'admin'
      ? req.body.estudiante_id
      : req.usuario.id;
    await pool.query(
      'INSERT INTO inscripciones (estudiante_id, curso_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [estudianteId, req.params.id]
    );
    res.json({ mensaje: 'Inscripción exitosa' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/cursos/:id/estudiantes — listar inscritos (admin)
router.get('/:id/estudiantes', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.nombre, u.email, i.inscrito_en
       FROM inscripciones i JOIN usuarios u ON u.id = i.estudiante_id
       WHERE i.curso_id = $1 ORDER BY i.inscrito_en DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

module.exports = router;
