-- ============================================
-- LMS - Plataforma de Capacitaciones
-- Schema PostgreSQL
-- ============================================

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nombre      VARCHAR(120) NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  rol         VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'estudiante')),
  avatar_url  VARCHAR(255),
  activo      BOOLEAN DEFAULT TRUE,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- CURSOS / CAPACITACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS cursos (
  id              SERIAL PRIMARY KEY,
  titulo          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  instructor_id   INT REFERENCES usuarios(id) ON DELETE SET NULL,
  imagen_url      VARCHAR(255),
  estado          VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'activo', 'cerrado')),
  creado_en       TIMESTAMP DEFAULT NOW()
);

-- Inscripciones estudiante ↔ curso
CREATE TABLE IF NOT EXISTS inscripciones (
  id            SERIAL PRIMARY KEY,
  estudiante_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
  curso_id      INT REFERENCES cursos(id) ON DELETE CASCADE,
  inscrito_en   TIMESTAMP DEFAULT NOW(),
  UNIQUE (estudiante_id, curso_id)
);

-- ============================================
-- MÓDULOS (dentro de cada curso)
-- ============================================
CREATE TABLE IF NOT EXISTS modulos (
  id          SERIAL PRIMARY KEY,
  curso_id    INT REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  orden       INT DEFAULT 0,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ARCHIVOS / CONTENIDO DE MÓDULOS
-- ============================================
CREATE TABLE IF NOT EXISTS archivos (
  id          SERIAL PRIMARY KEY,
  modulo_id   INT REFERENCES modulos(id) ON DELETE CASCADE,
  nombre      VARCHAR(255) NOT NULL,
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('pdf','excel','word','pptx','video','link','otro')),
  url         VARCHAR(500) NOT NULL,   -- ruta local o URL externa
  orden       INT DEFAULT 0,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- GRABACIONES EN VIVO (página de inicio del curso)
-- ============================================
CREATE TABLE IF NOT EXISTS grabaciones (
  id          SERIAL PRIMARY KEY,
  curso_id    INT REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  url         VARCHAR(500) NOT NULL,
  descripcion TEXT,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- INSTRUCTIVOS DEL CURSO
-- ============================================
CREATE TABLE IF NOT EXISTS instructivos (
  id          SERIAL PRIMARY KEY,
  curso_id    INT REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  contenido   TEXT,
  archivo_url VARCHAR(500),
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FOROS
-- ============================================
CREATE TABLE IF NOT EXISTS foros (
  id          SERIAL PRIMARY KEY,
  curso_id    INT REFERENCES cursos(id) ON DELETE CASCADE,
  titulo      VARCHAR(200) NOT NULL,
  descripcion TEXT,
  autor_id    INT REFERENCES usuarios(id) ON DELETE SET NULL,
  creado_en   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS foro_mensajes (
  id          SERIAL PRIMARY KEY,
  foro_id     INT REFERENCES foros(id) ON DELETE CASCADE,
  autor_id    INT REFERENCES usuarios(id) ON DELETE SET NULL,
  mensaje     TEXT NOT NULL,
  creado_en   TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- TAREAS
-- ============================================
CREATE TABLE IF NOT EXISTS tareas (
  id            SERIAL PRIMARY KEY,
  curso_id      INT REFERENCES cursos(id) ON DELETE CASCADE,
  titulo        VARCHAR(200) NOT NULL,
  descripcion   TEXT,
  fecha_limite  TIMESTAMP,
  puntaje_max   INT DEFAULT 100,
  creado_en     TIMESTAMP DEFAULT NOW()
);

-- Entregas de estudiantes
CREATE TABLE IF NOT EXISTS entregas (
  id              SERIAL PRIMARY KEY,
  tarea_id        INT REFERENCES tareas(id) ON DELETE CASCADE,
  estudiante_id   INT REFERENCES usuarios(id) ON DELETE CASCADE,
  comentario      TEXT,
  archivo_url     VARCHAR(500),
  entregado_en    TIMESTAMP DEFAULT NOW(),
  UNIQUE (tarea_id, estudiante_id)
);

-- ============================================
-- CALIFICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS calificaciones (
  id            SERIAL PRIMARY KEY,
  entrega_id    INT REFERENCES entregas(id) ON DELETE CASCADE UNIQUE,
  calificador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
  puntaje       NUMERIC(5,2) NOT NULL,
  comentario    TEXT,
  calificado_en TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inscripciones_estudiante ON inscripciones(estudiante_id);
CREATE INDEX IF NOT EXISTS idx_inscripciones_curso ON inscripciones(curso_id);
CREATE INDEX IF NOT EXISTS idx_modulos_curso ON modulos(curso_id);
CREATE INDEX IF NOT EXISTS idx_archivos_modulo ON archivos(modulo_id);
CREATE INDEX IF NOT EXISTS idx_tareas_curso ON tareas(curso_id);
CREATE INDEX IF NOT EXISTS idx_entregas_tarea ON entregas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_foro_mensajes_foro ON foro_mensajes(foro_id);
