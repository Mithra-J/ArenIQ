import { Link } from "react-router-dom";
import SatellitePreview from "../components/SatellitePreview";
import StatsPanel from "../components/StatsPanel";
import { portalStats, satellitePreviews } from "../data/mockData";

function Home() {
  return (
    <div className="overflow-hidden">
      <section className="relative border-b border-sky-900/10 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.18),_transparent_32%),linear-gradient(135deg,_#f8fafc,_#eff6ff_55%,_#ecfdf5)]">
        <div className="mx-auto grid max-w-[1600px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <div>
            <div className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-900">
              State Waterbody Governance Portal
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              ArenIQ monitors encroachments before waterbodies lose their natural edge.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              A modern geospatial dashboard for satellite surveillance, citizen complaint intake,
              district analytics, and administrative action tracking.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/dashboard" className="btn-primary">
                Open Monitoring Dashboard
              </Link>
              <Link to="/reports" className="btn-secondary">
                Submit Encroachment Report
              </Link>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Districts Connected", value: "18" },
                { label: "Monitoring Runs / Week", value: "126" },
                { label: "Average Response Time", value: "4.2 hrs" },
              ].map((item) => (
                <div key={item.label} className="rounded-[24px] border border-white/70 bg-white/80 p-5 shadow-lg shadow-sky-900/5 backdrop-blur">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-[0_30px_80px_-35px_rgba(3,105,161,0.35)] backdrop-blur">
            <div className="rounded-[28px] bg-gradient-to-br from-sky-950 via-sky-900 to-emerald-800 p-6 text-white">
              <p className="text-xs uppercase tracking-[0.32em] text-sky-100/80">Integrated Brief</p>
              <h2 className="mt-3 text-2xl font-semibold">Live Waterbody Protection Snapshot</h2>
              <div className="mt-8 space-y-4">
                {[
                  "Satellite change detection for lake and canal boundary anomalies",
                  "Citizen report workflows with evidence capture and routing",
                  "Enforcement visibility for approval, rejection, and closure status",
                ].map((point) => (
                  <div key={point} className="flex gap-3 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-300" />
                    <p className="text-sm leading-6 text-sky-50">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="section-kicker">System Highlights</p>
            <h2 className="section-title">Decision-ready dashboard for field and control room teams</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Early Detection",
              text: "Track shoreline variation, bund stress, and fill activity using periodic satellite scans.",
            },
            {
              title: "Citizen Participation",
              text: "Register public complaints with location, description, and image evidence in minutes.",
            },
            {
              title: "Administrative Workflow",
              text: "Review district reports, assign action, and measure resolution performance centrally.",
            },
            {
              title: "Map-based Monitoring",
              text: "Visualize critical encroachment clusters directly on an interactive monitoring map.",
            },
          ].map((item) => (
            <article key={item.title} className="card-surface p-6">
              <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-sky-900/10 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
          <p className="section-kicker">Statistics Preview</p>
          <h2 className="section-title mb-8">Current monitoring posture across the command network</h2>
          <StatsPanel stats={portalStats} />
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="section-kicker">About ArenIQ</p>
            <h2 className="section-title">Built for engineering project impact and real-world governance workflows</h2>
            <p className="mt-5 text-base leading-8 text-slate-600">
              The platform combines earth observation inputs, map-based inspection, and role-oriented
              dashboards to help agencies identify encroachments early and respond with confidence.
            </p>
            <p className="mt-4 text-base leading-8 text-slate-600">
              The interface is designed like a professional government command portal so your final
              year project feels deployment-ready rather than academic.
            </p>
          </div>
          <SatellitePreview previews={satellitePreviews} />
        </div>
      </section>

      <section className="bg-slate-950">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
          <div>
            <p className="section-kicker text-sky-300">Next Step</p>
            <h2 className="text-3xl font-semibold text-white">
              Launch the monitoring workspace and present a polished, government-grade frontend.
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/signup" className="btn-primary">
              Create Portal Account
            </Link>
            <Link to="/monitoring" className="btn-secondary border-white/20 bg-white/10 text-white hover:bg-white/20">
              View Satellite Monitoring
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
