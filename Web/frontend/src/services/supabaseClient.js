import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase frontend environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Web/frontend/.env and restart Vite.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signUpWithPassword({ email, password, fullName, phoneNumber }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        phone_number: phoneNumber,
      },
    },
  });
}

export async function signInWithPassword({ email, password }) {
  return supabase.auth.signInWithPassword({
    email,
    password,
  });
}

export async function signInWithGoogle() {
  const response = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (response.error) {
    console.error("[ArenIQ][OAuth] Google sign-in failed:", response.error);
  }

  return response;
}

export async function signOutUser() {
  return supabase.auth.signOut();
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function exchangeCodeForSession(currentUrl) {
  const response = await supabase.auth.exchangeCodeForSession(currentUrl);
  if (response.error) {
    console.error("[ArenIQ][OAuth] Callback exchange failed:", response.error);
  }
  return response;
}
// ─────────────────────────────────────────────
// REPORTS — Real Supabase data
// ─────────────────────────────────────────────

// Get all reports
export const getReports = async () => {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
};

// Get stats
export const getStats = async () => {
  const { count: total } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true });
  
  const { count: resolved } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'resolved');

  const { count: pending } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return { total, resolved, pending };
};

// Approve report
export const approveReport = async (id) => {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'resolved' })
    .eq('id', id);
  return !error;
};

// Reject report
export const rejectReport = async (id) => {
  const { error } = await supabase
    .from('reports')
    .update({ status: 'rejected' })
    .eq('id', id);
  return !error;
};