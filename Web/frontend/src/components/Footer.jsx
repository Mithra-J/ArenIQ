function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">ArenIQ</p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            Waterbody Encroachment Monitoring System
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Professional dashboard interface for satellite-assisted monitoring, public reporting,
            and administrative action tracking.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Portal Functions</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>Geospatial monitoring</li>
            <li>Citizen report intake</li>
            <li>District-level analytics</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Operational Contact</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>State Water Resources Department</li>
            <li>Integrated Command & Control Desk</li>
            <li>support@areniq.gov.portal</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
