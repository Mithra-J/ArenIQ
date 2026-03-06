/**
 * escalation.js — ArenIQ Alert Escalation Engine
 * ================================================
 * Handles time-bound escalation of encroachment reports.
 *
 * Escalation Flow:
 *   Level 1 → Local Authority        (24 hours to respond)
 *   Level 2 → District Collector     (if Level 1 ignores — 48 hours total)
 *   Level 3 → State Environment Dept (if Level 2 ignores — 72 hours total)
 *
 * This runs as a background job every hour, checking for
 * unresolved reports that have exceeded their response deadline.
 *
 * Author  : ArenIQ Team
 * License : MIT
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);

// ─────────────────────────────────────────────
// ESCALATION CONFIG
// ─────────────────────────────────────────────

const ESCALATION_LEVELS = {
  1: {
    label: 'Local Authority',
    hoursToRespond: 24,
    nextLevel: 2,
  },
  2: {
    label: 'District Collector',
    hoursToRespond: 48,
    nextLevel: 3,
  },
  3: {
    label: 'State Environment Department',
    hoursToRespond: 72,
    nextLevel: null, // Final level — no further escalation
  },
};

// ─────────────────────────────────────────────
// SEND ALERT via Ntfy.sh (FOSS push notifications)
// ─────────────────────────────────────────────

/**
 * Sends a push notification to the authority via Ntfy.sh.
 * Ntfy.sh is open-source and self-hostable — no proprietary APIs.
 *
 * @param {string} topic   - Ntfy topic for the authority (unique per authority)
 * @param {string} title   - Notification title
 * @param {string} message - Notification body
 * @param {string} priority - low | default | high | urgent
 */
async function sendAlert(topic, title, message, priority = 'high') {
  try {
    const response = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title'   : title,
        'Priority': priority,
        'Tags'    : 'warning,water',
        'Content-Type': 'text/plain',
      },
      body: message,
    });

    if (response.ok) {
      console.log(`[✓] Alert sent to topic: ${topic}`);
    } else {
      console.error(`[✗] Failed to send alert: ${response.status}`);
    }
  } catch (err) {
    console.error(`[✗] Alert error: ${err.message}`);
  }
}

// ─────────────────────────────────────────────
// GET AUTHORITY TOPIC BY LOCATION
// ─────────────────────────────────────────────

/**
 * Maps a report's escalation level to the correct Ntfy topic.
 * In production, this would look up the authority's topic from a DB table.
 * For the pilot, Chengalpattu authorities are hardcoded.
 *
 * @param {number} level - Escalation level (1, 2, or 3)
 * @returns {string} Ntfy topic string
 */
function getAuthorityTopic(level) {
  const topics = {
    1: 'areniq-local-chengalpattu',     // Local panchayat / municipality
    2: 'areniq-collector-chengalpattu', // District Collector office
    3: 'areniq-state-environment-tn',   // TN State Environment Department
  };
  return topics[level] || topics[1];
}

// ─────────────────────────────────────────────
// CORE ESCALATION CHECK
// ─────────────────────────────────────────────

/**
 * Checks all pending reports and escalates those that have exceeded
 * their response deadline.
 *
 * Called every hour by the scheduler (see startEscalationScheduler).
 */
async function checkAndEscalate() {
  console.log(`\n[${new Date().toISOString()}] Running escalation check...`);

  try {
    // Fetch all reports that are still pending or escalated (not resolved)
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .in('status', ['pending', 'escalated'])
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[✗] Failed to fetch reports:', error.message);
      return;
    }

    if (!reports || reports.length === 0) {
      console.log('[✓] No pending reports to check.');
      return;
    }

    console.log(`[→] Checking ${reports.length} pending report(s)...`);

    const now = new Date();

    for (const report of reports) {
      const currentLevel = report.escalation_level || 1;
      const levelConfig  = ESCALATION_LEVELS[currentLevel];

      if (!levelConfig) continue;

      // Calculate hours since the report was created
      const createdAt   = new Date(report.created_at);
      const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

      if (hoursElapsed >= levelConfig.hoursToRespond) {
        // Deadline exceeded — escalate!
        const nextLevel = levelConfig.nextLevel;

        if (nextLevel) {
          // Escalate to next level
          const nextConfig = ESCALATION_LEVELS[nextLevel];

          const { error: updateError } = await supabase
            .from('reports')
            .update({
              escalation_level: nextLevel,
              status          : 'escalated',
              escalated_at    : now.toISOString(),
            })
            .eq('id', report.id);

          if (!updateError) {
            console.log(
              `[↑] Report #${report.id} escalated: Level ${currentLevel} → Level ${nextLevel} (${nextConfig.label})`
            );

            // Send alert to the new authority
            await sendAlert(
              getAuthorityTopic(nextLevel),
              `🚨 ESCALATED: Waterbody Encroachment #${report.id}`,
              `This report has been escalated to ${nextConfig.label} because the previous authority did not respond within ${levelConfig.hoursToRespond} hours.\n\nType: ${report.type}\nLocation: ${report.latitude}, ${report.longitude}\nSource: ${report.source}\n\nImmediate action required.`,
              'urgent'
            );
          } else {
            console.error(`[✗] Failed to escalate report #${report.id}:`, updateError.message);
          }
        } else {
          // Already at final level — mark as critical
          const { error: updateError } = await supabase
            .from('reports')
            .update({ status: 'critical' })
            .eq('id', report.id);

          if (!updateError) {
            console.log(`[!] Report #${report.id} marked CRITICAL — no further escalation possible.`);

            await sendAlert(
              getAuthorityTopic(3),
              `🔴 CRITICAL: Unresolved Encroachment #${report.id}`,
              `This encroachment report has reached the highest escalation level and remains unresolved after 72 hours.\n\nType: ${report.type}\nLocation: ${report.latitude}, ${report.longitude}\n\nThis is the final notice. Immediate action is mandatory.`,
              'urgent'
            );
          }
        }
      } else {
        // Still within deadline — send reminder if approaching
        const hoursRemaining = levelConfig.hoursToRespond - hoursElapsed;

        if (hoursRemaining <= 6 && !report.reminder_sent) {
          // Send a 6-hour reminder
          await sendAlert(
            getAuthorityTopic(currentLevel),
            `⏰ REMINDER: Encroachment #${report.id} — Action Required`,
            `You have ${Math.round(hoursRemaining)} hours remaining to respond to this encroachment report before it escalates.\n\nType: ${report.type}\nLocation: ${report.latitude}, ${report.longitude}`,
            'high'
          );

          // Mark reminder as sent
          await supabase
            .from('reports')
            .update({ reminder_sent: true })
            .eq('id', report.id);

          console.log(`[⏰] Reminder sent for report #${report.id} (${Math.round(hoursRemaining)}h remaining)`);
        }
      }
    }

    console.log('[✓] Escalation check complete.\n');
  } catch (err) {
    console.error('[✗] Escalation check failed:', err.message);
  }
}

// ─────────────────────────────────────────────
// INITIAL ALERT — Send when report is first created
// ─────────────────────────────────────────────

/**
 * Sends the first alert to Level 1 authority when a new report comes in.
 * Called by server.js whenever a new report is inserted.
 *
 * @param {object} report - The newly created report object
 */
async function sendInitialAlert(report) {
  const topic = getAuthorityTopic(1);

  await sendAlert(
    topic,
    `🚨 New Encroachment Report #${report.id}`,
    `A new waterbody encroachment has been ${report.source === 'satellite' ? 'detected by satellite' : 'reported by a citizen'}.\n\nType: ${report.type}\nLocation: ${report.latitude}, ${report.longitude}\nSource: ${report.source === 'satellite' ? '🛰️ Satellite (NDWI Detection)' : '📱 Citizen Report'}\n\nYou have 24 hours to respond before this escalates to the District Collector.`,
    'high'
  );

  // Set initial escalation level in DB
  await supabase
    .from('reports')
    .update({ escalation_level: 1 })
    .eq('id', report.id);

  console.log(`[✓] Initial alert sent for report #${report.id}`);
}

// ─────────────────────────────────────────────
// SCHEDULER — Run every hour
// ─────────────────────────────────────────────

/**
 * Starts the escalation scheduler.
 * Runs checkAndEscalate() every hour automatically.
 * Call this once from server.js on startup.
 */
function startEscalationScheduler() {
  console.log('[✓] Escalation scheduler started — checking every hour.');

  // Run immediately on startup
  checkAndEscalate();

  // Then run every hour (3600000 ms)
  setInterval(checkAndEscalate, 60 * 60 * 1000);
}

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────

module.exports = {
  startEscalationScheduler,
  sendInitialAlert,
  checkAndEscalate,
};