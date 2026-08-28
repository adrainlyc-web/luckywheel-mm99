const { query, getClient, ensureSchema } = require('../../lib/db');
const { checkAdmin } = require('../../lib/auth');

module.exports = async (req, res) => {
  if (!checkAdmin(req, res)) return;

  await ensureSchema();

  if (req.method === 'GET') {
    const result = await query(
      'SELECT id, label, color, weight FROM prizes ORDER BY sort_order ASC'
    );
    res.status(200).json({ prizes: result.rows });
    return;
  }

  if (req.method === 'POST') {
    const prizes = Array.isArray(req.body && req.body.prizes) ? req.body.prizes : null;
    if (!prizes || prizes.length === 0) {
      res.status(400).json({ error: 'Send at least one prize.' });
      return;
    }

    for (const p of prizes) {
      const label = (p.label || '').trim();
      const weight = Number(p.weight);
      if (!label) {
        res.status(400).json({ error: 'Every prize needs a label.' });
        return;
      }
      if (!Number.isFinite(weight) || weight <= 0) {
        res.status(400).json({ error: `"${label}" needs a win rate weight greater than 0.` });
        return;
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM prizes');
      for (let i = 0; i < prizes.length; i++) {
        const p = prizes[i];
        const color = (p.color || '#7c3aed').trim();
        await client.query(
          'INSERT INTO prizes (label, color, weight, sort_order) VALUES ($1, $2, $3, $4)',
          [p.label.trim(), color, Number(p.weight), i]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Failed to save prizes.' });
      return;
    } finally {
      client.release();
    }

    const result = await query(
      'SELECT id, label, color, weight FROM prizes ORDER BY sort_order ASC'
    );
    res.status(200).json({ prizes: result.rows });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
