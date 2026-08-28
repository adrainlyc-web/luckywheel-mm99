const { query, ensureSchema } = require('../lib/db');

module.exports = async (req, res) => {
  await ensureSchema();

  const result = await query(
    'SELECT label, color FROM prizes ORDER BY sort_order ASC'
  );

  res.status(200).json({ prizes: result.rows });
};
