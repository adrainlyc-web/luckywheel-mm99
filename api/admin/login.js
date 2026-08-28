module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server.' });
    return;
  }

  const password = req.body && req.body.password;
  if (password !== expected) {
    res.status(401).json({ error: 'Wrong password.' });
    return;
  }

  res.status(200).json({ ok: true });
};
