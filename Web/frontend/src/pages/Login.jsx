import { Link } from "react-router-dom";
import StatusAlert from "../components/StatusAlert";

function Login() {
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
          <form className="mt-8 space-y-5">
            <label className="form-field">
              <span>Email Address</span>
              <input type="email" placeholder="officer@department.gov" className="input-field" />
            </label>
            <label className="form-field">
              <span>Password</span>
              <input type="password" placeholder="Enter secure password" className="input-field" />
            </label>
            <button type="submit" className="btn-primary w-full justify-center">
              Sign In
            </button>
          </form>

          <div className="mt-6">
            <StatusAlert
              title="Demo Mode"
              message="This frontend uses example authentication forms and is ready to connect to your backend."
              tone="info"
            />
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
