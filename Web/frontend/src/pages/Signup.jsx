import { useState } from "react";
import { Link } from "react-router-dom";
import StatusAlert from "../components/StatusAlert";
import { signUpWithPassword } from "../services/supabaseClient";

function Signup() {
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setErrorMessage("");

    const { error } = await signUpWithPassword(formData);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("Account created. If email confirmation is enabled in Supabase, verify your email before logging in.");
    setIsSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid overflow-hidden rounded-[32px] border border-sky-900/10 bg-white shadow-[0_30px_80px_-35px_rgba(15,23,42,0.35)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-8 sm:p-10">
          <p className="section-kicker">Registration</p>
          <h1 className="section-title">Create a monitored access account</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            Register as a project user to access reports, submit grievances, and review monitoring outputs.
          </p>

          <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="form-field md:col-span-2">
              <span>Full Name</span>
              <input
                type="text"
                placeholder="Enter applicant name"
                className="input-field"
                value={formData.fullName}
                onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
              />
            </label>
            <label className="form-field">
              <span>Phone Number</span>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="input-field"
                value={formData.phoneNumber}
                onChange={(event) => setFormData((current) => ({ ...current, phoneNumber: event.target.value }))}
              />
            </label>
            <label className="form-field">
              <span>Email Address</span>
              <input
                type="email"
                placeholder="citizen@example.com"
                className="input-field"
                value={formData.email}
                onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label className="form-field md:col-span-2">
              <span>Password</span>
              <input
                type="password"
                placeholder="Create a strong password"
                className="input-field"
                value={formData.password}
                onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary w-full justify-center">
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            {errorMessage ? <StatusAlert title="Signup Failed" message={errorMessage} tone="error" /> : null}
            {message ? <StatusAlert title="Signup Complete" message={message} tone="success" /> : null}
          </div>

          <p className="mt-6 text-sm text-slate-600">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-sky-900 hover:text-emerald-700">
              Sign in here
            </Link>
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-800 via-sky-900 to-slate-950 p-8 text-white sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/75">Why Register</p>
          <h2 className="mt-4 text-3xl font-semibold">Trusted intake for public encroachment reporting</h2>
          <div className="mt-8 grid gap-4">
            {[
              "Submit photo-backed complaints directly into the portal",
              "Track case status from verification to resolution",
              "Access district dashboard views for project demonstrations",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 text-sm leading-6">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
