const { Pool } = require('pg');
const { DEFAULT_PRIZES } = require('../config/prizes');

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

let pool;
function getPool() {
  if (!pool) {
    if (!connectionString) {
      throw new Error(
        'No database connection string found. Add a Postgres integration in Vercel (Storage tab) so POSTGRES_URL or DATABASE_URL is set.'
      );
    }
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

function getClient() {
  return getPool().connect();
}

let schemaReady;
async function ensureSchema() {
  // Reuse the in-flight/completed promise across warm serverless invocations
  // so concurrent requests don't race to create the same tables. Reset on
  // failure so the next call retries instead of replaying a cached rejection.
  if (!schemaReady) {
    schemaReady = ensureSchemaOnce().catch((err) => {
      schemaReady = undefined;
      throw err;
    });
  }
  return schemaReady;
}

async function ensureSchemaOnce() {
  await query(`
    CREATE TABLE IF NOT EXISTS entries (
      phone TEXT PRIMARY KEY,
      name TEXT,
      claimed BOOLEAN NOT NULL DEFAULT FALSE,
      prize TEXT,
      prize_index INTEGER,
      claimed_at TIMESTAMPTZ
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS prizes (
      id SERIAL PRIMARY KEY,
      label TEXT NOT NULL,
      color TEXT NOT NULL,
      weight INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    )
  `);

  const existing = await query('SELECT COUNT(*)::int AS count FROM prizes');
  if (existing.rows[0].count === 0) {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < DEFAULT_PRIZES.length; i++) {
        const p = DEFAULT_PRIZES[i];
        await client.query(
          'INSERT INTO prizes (label, color, weight, sort_order) VALUES ($1, $2, $3, $4)',
          [p.label, p.color, p.weight, i]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

function normalizePhone(raw) {
  return String(raw || '').replace(/[\s\-()]/g, '').trim();
}

module.exports = { query, getClient, ensureSchema, normalizePhone };
