const { supabaseAdmin } = require("../database/supabase");

async function getStatistics(_req, res, next) {
  try {
    const [{ count: reportsCount }, { count: waterbodiesCount }, { count: encroachmentsCount }] =
      await Promise.all([
        supabaseAdmin.from("reports").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("waterbodies").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("encroachments").select("*", { count: "exact", head: true }),
      ]);

    const { count: pendingCount } = await supabaseAdmin
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    res.json({
      reports: reportsCount || 0,
      waterbodies: waterbodiesCount || 0,
      encroachments: encroachmentsCount || 0,
      pendingReports: pendingCount || 0,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatistics,
};
