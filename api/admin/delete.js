const { query, ensureSchema, normalizePhone } = require('../../lib/db');
const { checkAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!checkAdmin(req, res)) return;

  await ensureSchema();

  const body = req.body || {};

  if (body.clearClaimed) {
    const result = await query('DELETE FROM entries WHERE claimed = TRUE RETURNING phone');
    res.status(200).json({ deleted: result.rows.length });
    return;
  }

  const phone = normalizePhone(body.phone);
  if (!phone) {
    res.status(400).json({ error: 'Provide a phone number, or clearClaimed: true.' });
    return;
  }

  const result = await query('DELETE FROM entries WHERE phone = $1 RETURNING phone', [phone]);
  res.status(200).json({ deleted: result.rows.length });
};
