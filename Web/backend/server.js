/**
 * server.js — ArenIQ Backend Server
 * ===================================
 * Express server that powers the ArenIQ dashboard and alert system.
 *
 * Routes:
 * GET /reports — Fetch all encroachment reports (for dashboard)
 * POST /report — Create a new report + trigger authority alert
 * PUT /reports/:id/acknowledge — Mark as acknowledged (stops escalation timer)
 * PUT /reports/:id/resolve — Mark as resolved
 * GET /reports/stats — Summary stats
 *
 * On startup, the escalation scheduler runs every hour to check
 * for unresponded reports and escalate to higher authorities.
 *
 * Author : ArenIQ Team
 * License : MIT
 * TEAM NOTE: Updated with acknowledge/resolve routes for dashboard actions.
 */

const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { startEscalationScheduler, sendInitialAlert } = require('./escalation');

// ─────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project-ref.supabase.co',
  process.env.SUPABASE_KEY || 'your-anon-or-service-key'  // TEAM NOTE: Use anon key for public routes
);

// ─────────────────────────────────────────────
// EXPRESS SETUP
// ─────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES (existing + new)
app.get('/reports', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/reports/stats', async (req, res) => {
  try {
    const { count: total } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true });
    const { count: resolved } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved');
    const { count: critical } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'critical');
    res.json({ total, resolved, critical });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/report', async (req, res) => {
  const { type, description, latitude, longitude, image_url, source } = req.body;
  if (!type || !latitude || !longitude) {
    return res.status(400).json({ error: 'type, latitude and longitude are required' });
  }
  // Insert report into Supabase
  const { data, error } = await supabase
    .from('reports')
    .insert({
      type,
      description,
      latitude,
      longitude,
      image_url,
      source: source || 'satellite',
      status: 'pending',
      escalation_level: 1,
      reminder_sent: false,
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  // Send immediate alert to Level 1 (Local Authority)
  await sendInitialAlert(data);
  res.json({ message: 'Report created and authority alerted', report: data });
});

// NEW: Acknowledge report (e.g., "We've seen it" — changes status, logs action)
app.put('/reports/:id/acknowledge', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  console.log(`[✓] Report #${id} acknowledged`);  // TEAM NOTE: Escalation will pause on next check
  res.json({ message: 'Report acknowledged', report: data });
});

// NEW: Resolve report (e.g., "Action taken" — final status)
app.put('/reports/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error });
  console.log(`[✓] Report #${id} marked as resolved`);
  res.json({ message: 'Report resolved', report: data });
});

// Existing manual escalate route (for testing)
app.put('/reports/:id/escalate', async (req, res) => {
  const { id } = req.params;
  const { checkAndEscalate } = require('./escalation');
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Report not found' });
  await checkAndEscalate();
  res.json({ message: 'Escalation check triggered' });
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n[✓] ArenIQ backend running on port ${PORT}`);
  console.log(`[✓] Supabase connected`);
  // Start hourly escalation checker
  startEscalationScheduler();
});