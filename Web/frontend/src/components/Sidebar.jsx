import { NavLink } from "react-router-dom";

const sideLinks = [
  { label: "Overview", to: "/dashboard" },
  { label: "Satellite Monitoring", to: "/monitoring" },
  { label: "Citizen Reports", to: "/reports" },
  { label: "Admin Panel", to: "/admin" },
];

function Sidebar() {
  return (
    <aside className="sticky top-24 hidden h-fit w-72 shrink-0 rounded-[28px] border border-sky-900/10 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] xl:block">
      <div className="rounded-2xl bg-gradient-to-br from-sky-950 via-sky-900 to-emerald-800 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-sky-100/80">Command Console</p>
        <h2 className="mt-2 text-xl font-semibold">Waterbody Encroachment Cell</h2>
        <p className="mt-3 text-sm text-sky-100/85">
          Unified decision support for surveillance, alerts, reporting, and enforcement.
        </p>
      </div>

      <div className="mt-6 space-y-2">
        {sideLinks.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-sky-900 text-white shadow-lg shadow-sky-900/20"
                  : "text-slate-600 hover:bg-slate-50 hover:text-sky-900"
              }`
            }
          >
            <span>{item.label}</span>
            <span className="text-xs uppercase tracking-[0.18em] opacity-75">Open</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Operational Brief</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          18 districts synced today. 7 high-priority encroachment clusters await field validation.
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
