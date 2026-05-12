// Script para inicializar la base de datos en Render
// Ejecutar una sola vez: node db/init.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'campusvirtual_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

async function init() {
  try {
    console.log('🔄 Inicializando base de datos...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Tablas creadas correctamente');

    // Crear usuario Super Admin por defecto
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Admin2024!', 10);
    await pool.query(`
      INSERT INTO usuarios (nombre, email, password, rol)
      VALUES ('Super Admin', 'admin@campusvirtual.co', $1, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [hash]);
    console.log('✅ Usuario admin creado: admin@campusvirtual.co / Admin2024!');
    console.log('⚠️  Cambia la contraseña después del primer login');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

init();
