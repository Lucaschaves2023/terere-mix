/* ============================================
   Tereré Mix — Database Config (PostgreSQL)
   Pool de conexões via node-postgres (pg)
   ============================================ */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: true }
    : false,
});

/* Converte placeholders ? → $1, $2, $3 ... */
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

const db = {

  /* Retorna array de linhas */
  async all(sql, params = []) {
    const { rows } = await pool.query(toPg(sql), params);
    return rows;
  },

  /* Retorna primeira linha ou null */
  async get(sql, params = []) {
    const { rows } = await pool.query(toPg(sql), params);
    return rows[0] ?? null;
  },

  /* INSERT → adiciona RETURNING id e retorna { lastInsertRowid } */
  async run(sql, params = []) {
    const { rows } = await pool.query(toPg(sql) + ' RETURNING id', params);
    return { lastInsertRowid: rows[0]?.id ?? null };
  },

  /* UPDATE / DELETE — sem retorno de id */
  async exec(sql, params = []) {
    await pool.query(toPg(sql), params);
  },

  /*
   * Transação atômica.
   * Uso: await db.transaction(async (tx) => { ... })
   * tx expõe all / get / run / exec usando o mesmo client,
   * garantindo que tudo acontece dentro do mesmo BEGIN/COMMIT.
   */
  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const tx = {
        async all(sql, params = [])  {
          const { rows } = await client.query(toPg(sql), params);
          return rows;
        },
        async get(sql, params = [])  {
          const { rows } = await client.query(toPg(sql), params);
          return rows[0] ?? null;
        },
        async run(sql, params = [])  {
          const { rows } = await client.query(toPg(sql) + ' RETURNING id', params);
          return { lastInsertRowid: rows[0]?.id ?? null };
        },
        async exec(sql, params = []) {
          await client.query(toPg(sql), params);
        },
      };

      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};

module.exports = { db, pool };
