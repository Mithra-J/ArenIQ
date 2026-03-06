/**
 * server.js — ArenIQ Backend Server
 * ===================================
 * Express server that powers the ArenIQ dashboard and alert system.
 *
 * Routes:
 *   GET  /reports        — Fetch all encroachment reports (for dashboard)
 *   POST /report         — Create a new report + trigger authority alert
 *   PUT  /reports/:id/resolve — Mark a report as resolved
 *
 * On startup, the escalation scheduler runs every hour to check
 * for unresponded reports and escalate to higher authorities.
 *
 * Author  : ArenIQ Team
 * License : MIT
 */

const express = require('express');
const cors    = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { startEscalationScheduler, sendInitialAlert } = require('./escalation');

// ─────────────────────────────────────────────
// SUPABASE CLIENT
// ─────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL      || 'https://your-project-ref.supabase.co',
  process.env.SUPABASE_KEY      || 'your-anon-or-service-key'
);

// ─────────────────────────────────────────────
// EXPRESS SETUP
// ─────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

/**
 * GET /reports
 * Fetch all encroachment reports ordered by newest first.
 * Used by the React dashboard to display live data.
 */
app.get('/reports', async (req, res) => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error });
  res.json(data);
});

/**
 * GET /reports/stats
 * Returns summary stats for the dashboard header.
 * Total flagged, total resolved, total critical.
 */
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

/**
 * POST /report
 * Create a new encroachment report and immediately alert
 * the responsible local authority via Ntfy.sh.
 *
 * Body: { type, description, latitude, longitude, image_url, source }
 * source = 'satellite' (from ndwi_detection.py) or 'citizen' (from Flutter app)
 */
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
      source      : source || 'satellite',
      status      : 'pending',
      escalation_level: 1,
      reminder_sent   : false,
    })
    .select()   // Get the inserted row back
    .single();  // We inserted one row, return it as object

  if (error) return res.status(500).json({ error });

  // Send immediate alert to Level 1 (Local Authority)
  await sendInitialAlert(data);

  res.json({ message: 'Report created and authority alerted', report: data });
});

/**
 * PUT /reports/:id/resolve
 * Mark an encroachment report as resolved by the authority.
 * Used by the dashboard when an official takes action.
 */
app.put('/reports/:id/resolve', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('reports')
    .update({
      status     : 'resolved',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error });

  console.log(`[✓] Report #${id} marked as resolved`);
  res.json({ message: 'Report resolved', report: data });
});

/**
 * PUT /reports/:id/escalate
 * Manually escalate a report (for testing or admin use).
 */
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