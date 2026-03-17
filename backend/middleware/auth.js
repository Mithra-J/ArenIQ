// backend/middleware/auth.js
const { supabaseAdmin } = require('../database/supabase');

/**
 * Protects officer-only routes using Supabase JWT
 * Frontend already sends Authorization: Bearer <token>
 */
async function requireOfficer(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) throw new Error('Invalid token');

    // Optional: check role from users table (you can extend later)
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Unauthorized – officer access only' });
  }
}

module.exports = { requireOfficer };