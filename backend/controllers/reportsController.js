const { supabaseAdmin } = require("../database/supabase");
const { sendNotification } = require("../services/notifications");

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
    };

    const { data, error } = await supabaseAdmin.from("reports").insert(payload).select("*").single();
    if (error) throw error;

    await sendNotification({
      title: "New ArenIQ Encroachment Report",
      message: `${data.title} reported at ${data.location_name || `${data.latitude}, ${data.longitude}`}`,
      priority: "high",
    });

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createReport,
  getReports,
};
