const { supabaseAdmin } = require("../database/supabase");

async function getWaterbodies(_req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("waterbodies")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWaterbodies,
};
