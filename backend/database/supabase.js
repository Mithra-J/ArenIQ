const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[ArenIQ] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Backend routes will fail until these are configured.",
  );
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[ArenIQ] SUPABASE_SERVICE_ROLE_KEY is not set. Backend is falling back to the anon key, so Storage uploads and protected writes may require permissive RLS policies.",
  );
}

const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabasePublic = createClient(supabaseUrl || "", supabaseAnonKey || "", {
  auth: { persistSession: false, autoRefreshToken: false },
});

module.exports = {
  supabaseAdmin,
  supabasePublic,
};
