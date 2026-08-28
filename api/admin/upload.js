const { query, ensureSchema, normalizePhone } = require('../../lib/db');
const { checkAdmin } = require('../../lib/auth');

const MAX_ENTRIES_PER_REQUEST = 2000;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!checkAdmin(req, res)) return;

  const entries = Array.isArray(req.body && req.body.entries) ? req.body.entries : null;
  if (!entries || entries.length === 0) {
    res.status(400).json({ error: 'Send { entries: [{ name, phone }, ...] }' });
    return;
  }
  if (entries.length > MAX_ENTRIES_PER_REQUEST) {
    res.status(400).json({ error: `Send at most ${MAX_ENTRIES_PER_REQUEST} entries per upload.` });
    return;
  }

  await ensureSchema();

  let added = 0;
  let skipped = 0;

  for (const entry of entries) {
    const phone = normalizePhone(entry.phone);
    const name = (entry.name || '').trim() || null;
    if (!phone) {
      skipped++;
      continue;
    }
    const result = await query(
      `INSERT INTO entries (phone, name)
       VALUES ($1, $2)
       ON CONFLICT (phone) DO NOTHING
       RETURNING phone`,
      [phone, name]
    );
    if (result.rows.length > 0) {
      added++;
    } else {
      skipped++;
    }
  }

  res.status(200).json({ added, skipped });
};
