const { Pool } = require('pg');
require('dotenv').config();

// Render provee DATABASE_URL automáticamente
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     process.env.DB_PORT     || 5432,
      database: process.env.DB_NAME     || 'campusvirtual_db',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || '',
    });

pool.on('connect', () => console.log('✅ PostgreSQL conectado'));
pool.on('error',   (err) => console.error('❌ Error PostgreSQL:', err));

module.exports = pool;
