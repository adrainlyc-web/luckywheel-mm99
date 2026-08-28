const { query, ensureSchema } = require('../../lib/db');
const { checkAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!checkAdmin(req, res)) return;

  await ensureSchema();

  const result = await query(`
    SELECT phone, name, claimed, prize, claimed_at
    FROM entries
    ORDER BY claimed ASC, name ASC NULLS LAST, phone ASC
  `);

  const entries = result.rows;
  const claimedCount = entries.filter((e) => e.claimed).length;

  res.status(200).json({
    entries,
    total: entries.length,
    claimed: claimedCount,
    pending: entries.length - claimedCount,
  });
};
