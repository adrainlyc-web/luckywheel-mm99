function checkAdmin(req, res) {
  const provided = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: 'ADMIN_PASSWORD is not set on the server.' });
    return false;
  }
  if (!provided || provided !== expected) {
    res.status(401).json({ error: 'Wrong password.' });
    return false;
  }
  return true;
}

module.exports = { checkAdmin };
