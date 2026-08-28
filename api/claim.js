const { query, ensureSchema, normalizePhone } = require('../lib/db');
const { pickPrizeIndex } = require('../lib/prizeLogic');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const phone = normalizePhone(req.body && req.body.phone);
  if (!phone) {
    res.status(400).json({ error: 'Phone number is required.' });
    return;
  }

  await ensureSchema();

  const existing = await query('SELECT * FROM entries WHERE phone = $1', [phone]);
  const row = existing.rows[0];

  if (!row) {
    res.status(404).json({ status: 'not_eligible' });
    return;
  }

  if (row.claimed) {
    res.status(200).json({
      status: 'already_claimed',
      name: row.name,
      prizeIndex: row.prize_index,
      prize: row.prize,
      claimedAt: row.claimed_at,
    });
    return;
  }

  const prizesResult = await query(
    'SELECT label, weight FROM prizes ORDER BY sort_order ASC'
  );
  const prizes = prizesResult.rows;
  if (prizes.length === 0) {
    res.status(500).json({ error: 'No prizes are configured yet.' });
    return;
  }

  const prizeIndex = pickPrizeIndex(prizes);
  const prize = prizes[prizeIndex].label;

  const updated = await query(
    `UPDATE entries
     SET claimed = TRUE, prize = $2, prize_index = $3, claimed_at = NOW()
     WHERE phone = $1 AND claimed = FALSE
     RETURNING *`,
    [phone, prize, prizeIndex]
  );

  if (updated.rows.length === 0) {
    // Lost a race against a concurrent request for the same phone — return whoever won it.
    const raced = await query('SELECT * FROM entries WHERE phone = $1', [phone]);
    const racedRow = raced.rows[0];
    res.status(200).json({
      status: 'already_claimed',
      name: racedRow.name,
      prizeIndex: racedRow.prize_index,
      prize: racedRow.prize,
      claimedAt: racedRow.claimed_at,
    });
    return;
  }

  const won = updated.rows[0];
  res.status(200).json({
    status: 'won',
    name: won.name,
    prizeIndex: won.prize_index,
    prize: won.prize,
    claimedAt: won.claimed_at,
  });
};
