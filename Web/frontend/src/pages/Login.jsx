import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusAlert from "../components/StatusAlert";
import { signInWithGoogle, signInWithPassword } from "../services/supabaseClient";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    const { error } = await signInWithPassword(formData);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    navigate("/dashboard");
  }

  async function handleGoogleLogin() {
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[32px] border border-sky-900/10 bg-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-gradient-to-br from-sky-950 via-sky-900 to-emerald-800 p-8 text-white sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-100/80">Secure Access</p>
          <h2 className="mt-4 text-3xl font-semibold">Officer and citizen portal login</h2>
          <p className="mt-4 text-sm leading-7 text-sky-50/85">
            Sign in to access monitoring dashboards, file reports, and track administrative action.
          </p>
          <div className="mt-8 space-y-4">
            {["Role-based access", "Audit-ready reporting history", "Secure district monitoring workflows"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <p className="section-kicker">Login</p>
          <h1 className="section-title">Access your ArenIQ workspace</h1>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="form-field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="officer@department.gov"
                className="input-field"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input
                type="password"
                placeholder="Enter secure password"
                className="input-field"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button type="submit" className="btn-primary w-full justify-center">
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
            <button type="button" className="btn-secondary w-full justify-center" onClick={handleGoogleLogin}>
              Sign In With Google
            </button>
          </form>

          <div className="mt-6">
            {errorMessage ? (
              <StatusAlert title="Login Failed" message={errorMessage} tone="error" />
            ) : (
              <StatusAlert
                title="Supabase Auth Connected"
                message="Email/password and Google OAuth are now wired through Supabase Auth."
                tone="success"
              />
            )}
          </div>

          <p className="mt-6 text-sm text-slate-600">
            New user?{" "}
            <Link to="/signup" className="font-semibold text-sky-900 hover:text-emerald-700">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
