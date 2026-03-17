// backend/controllers/reportsController.js
const { supabaseAdmin } = require("../database/supabase");
const { sendNotification } = require("../services/notifications");
const { calculateSeverity } = require("../services/aiSeverity");           // ← AI added
const { sendInitialAlert } = require("../escalation");            // ← escalation added


async function getReports(_req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("reports")
      .select("*, waterbodies(name, district), encroachments(status, severity)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
}

async function createReport(req, res, next) {
  try {
    const {
      title,
      description,
      latitude,
      longitude,
      locationName,
      waterbodyId,
      imageUrl,
      userId,
      source = "citizen",
    } = req.body;

    if (!title || !description || latitude == null || longitude == null) {
      return res.status(400).json({
        error: "title, description, latitude, and longitude are required",
      });
    }

    // 🔥 AI Severity Scoring
    const severity = calculateSeverity({ type: title, source, confidence: 75 });

    const payload = {
      title,
      description,
      latitude,
      longitude,
      location_name: locationName || null,
      waterbody_id: waterbodyId || null,
      image_url: imageUrl || null,
      user_id: userId || null,
      source,
      status: "pending",
      severity_score: severity.score,
      severity_label: severity.label,
      escalation_level: 1,
    };

    const { data, error } = await supabaseAdmin.from("reports").insert(payload).select("*").single();
    if (error) throw error;

    // Send immediate alert + start escalation timer
    await sendInitialAlert(data);
    await sendNotification({
      title: `New Report • ${severity.label} Severity`,
      message: `${data.title} at ${data.location_name || `${data.latitude}, ${data.longitude}`}`,
      priority: severity.score > 70 ? "urgent" : "high",
    });

    res.status(201).json({ ...data, severity });
  } catch (error) {
    next(error);
  }
}

// NEW: Officer actions (used by your dashboard buttons)
async function acknowledgeReport(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("reports")
      .update({ status: "acknowledged", acknowledged_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Acknowledged – escalation paused", report: data });
  } catch (error) {
    next(error);
  }
}

async function resolveReport(req, res, next) {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("reports")
      .update({ status: "resolved", resolved_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: "Report resolved", report: data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  getReports,
  acknowledgeReport,   // ← new
  resolveReport,       // ← new
};