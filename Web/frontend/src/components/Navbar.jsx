import { NavLink } from "react-router-dom";

const navLinks = [
  { label: "Home", to: "/" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Satellite Monitoring", to: "/monitoring" },
  { label: "Reports", to: "/reports" },
  { label: "Login", to: "/login" },
  { label: "Signup", to: "/signup" },
];

function CrestIcon() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-sky-800 text-white shadow-lg shadow-sky-900/20">
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.7]">
        <path d="M12 3c3.8 2.3 6 2.5 8 2.6v5.4c0 5.5-3 8.8-8 10-5-1.2-8-4.5-8-10V5.6c2-.1 4.2-.3 8-2.6Z" />
        <path d="M8 12h8" />
        <path d="M12 8v8" />
      </svg>
    </div>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-sky-900/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <CrestIcon />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-800">
              Government Waterbody Cell
            </p>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">ArenIQ</h1>
          </div>
        </NavLink>

        <nav className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50/90 p-2 lg:flex">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-900 text-white shadow-lg shadow-sky-900/20"
                    : "text-slate-600 hover:bg-white hover:text-sky-900"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Live Status</p>
            <p className="text-sm font-semibold text-emerald-700">Monitoring Active</p>
          </div>
          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.15)]" />
        </div>

        <nav className="flex w-full gap-2 overflow-x-auto pb-1 lg:hidden">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-sky-900 text-white shadow-lg shadow-sky-900/20"
                    : "border border-slate-200 bg-slate-50 text-slate-600"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
