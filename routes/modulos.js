const router = require('express').Router();
const pool   = require('../db/pool');
const multer = require('multer');
const path   = require('path');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const permitidos = /pdf|xlsx|xls|docx|doc|pptx|ppt|mp4|webm|avi|mov/;
    const ext = permitidos.test(path.extname(file.originalname).toLowerCase());
    ext ? cb(null, true) : cb(new Error('Tipo de archivo no permitido'));
  }
});

// GET /api/modulos?curso_id=X
router.get('/', verificarToken, async (req, res) => {
  try {
    const { curso_id } = req.query;
    if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });
    const { rows } = await pool.query(
      'SELECT * FROM modulos WHERE curso_id=$1 ORDER BY orden, creado_en',
      [curso_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// GET /api/modulos/:id — módulo con sus archivos
router.get('/:id', verificarToken, async (req, res) => {
  try {
    const { rows: [modulo] } = await pool.query('SELECT * FROM modulos WHERE id=$1', [req.params.id]);
    if (!modulo) return res.status(404).json({ error: 'Módulo no encontrado' });
    const { rows: archivos } = await pool.query(
      'SELECT * FROM archivos WHERE modulo_id=$1 ORDER BY orden, creado_en',
      [req.params.id]
    );
    res.json({ ...modulo, archivos });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/modulos — crear módulo (admin)
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { curso_id, titulo, descripcion, orden } = req.body;
    if (!curso_id || !titulo) return res.status(400).json({ error: 'curso_id y título requeridos' });
    const { rows } = await pool.query(
      'INSERT INTO modulos (curso_id, titulo, descripcion, orden) VALUES ($1,$2,$3,$4) RETURNING *',
      [curso_id, titulo, descripcion, orden || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// PUT /api/modulos/:id (admin)
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    const { titulo, descripcion, orden } = req.body;
    const { rows } = await pool.query(
      `UPDATE modulos SET titulo=COALESCE($1,titulo), descripcion=COALESCE($2,descripcion),
       orden=COALESCE($3,orden) WHERE id=$4 RETURNING *`,
      [titulo, descripcion, orden, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Módulo no encontrado' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// DELETE /api/modulos/:id (admin)
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM modulos WHERE id=$1', [req.params.id]);
    res.json({ mensaje: 'Módulo eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

// POST /api/modulos/:id/archivos — subir archivo a módulo (admin)
router.post('/:id/archivos', verificarToken, soloAdmin, upload.single('archivo'), async (req, res) => {
  try {
    const { nombre, tipo, url, orden } = req.body;
    // Si se subió un archivo físico, usa su ruta; si no, usa URL externa
    const archivoUrl = req.file ? `/uploads/${req.file.filename}` : url;
    if (!archivoUrl) return res.status(400).json({ error: 'Archivo o URL requerido' });

    const tipoFinal = tipo || detectarTipo(req.file?.originalname || url || '');
    const { rows } = await pool.query(
      `INSERT INTO archivos (modulo_id, nombre, tipo, url, orden)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [req.params.id, nombre || req.file?.originalname || 'Archivo', tipoFinal, archivoUrl, orden || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: err.message }); }
});

// DELETE /api/modulos/archivos/:archivoId (admin)
router.delete('/archivos/:archivoId', verificarToken, soloAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM archivos WHERE id=$1', [req.params.archivoId]);
    res.json({ mensaje: 'Archivo eliminado' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Error interno' }); }
});

function detectarTipo(nombre) {
  const ext = path.extname(nombre).toLowerCase();
  const mapa = { '.pdf':'pdf', '.xlsx':'excel', '.xls':'excel', '.docx':'word', '.doc':'word',
                 '.pptx':'pptx', '.ppt':'pptx', '.mp4':'video', '.webm':'video', '.avi':'video', '.mov':'video' };
  return mapa[ext] || 'link';
}

module.exports = router;
