import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import LoadingSpinner from "../components/LoadingSpinner";
import MapView from "../components/MapView";
import ReportCard from "../components/ReportCard";
import StatsPanel from "../components/StatsPanel";
import StatusAlert from "../components/StatusAlert";
import {
  encroachmentTrend,
  mapMarkers,
  monthlyMonitoring,
  portalStats,
  reportCards,
} from "../data/mockData";

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="rounded-[28px] border border-sky-900/10 bg-white p-6 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function Dashboard() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-sky-900/10 bg-gradient-to-r from-sky-950 via-sky-900 to-emerald-800 p-7 text-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.75)]">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-sky-100/80">Monitoring Dashboard</p>
            <h2 className="mt-3 text-3xl font-semibold">State waterbody protection command view</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-sky-50/85">
              Review active alerts, district trends, and geospatial signals from a single operational workspace.
            </p>
          </div>
          <LoadingSpinner label="Last sync: 14 Mar 2026, 10:30 AM" />
        </div>
      </section>

      <StatsPanel stats={portalStats} />

      <StatusAlert
        title="Priority Advisory"
        message="Three red-flag sites show recurring boundary alteration within 500 meters of high-density settlements."
        tone="error"
      />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <ChartPanel
          title="Encroachment Trend"
          subtitle="Monthly comparison of detected encroachments and resolved actions."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={encroachmentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="detected" stroke="#0369a1" strokeWidth={3} />
                <Line type="monotone" dataKey="resolved" stroke="#0f766e" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>

        <ChartPanel
          title="Monthly Monitoring Load"
          subtitle="Survey scan volume against alert creation across the current cycle."
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyMonitoring}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="period" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip />
                <Legend />
                <Bar dataKey="scans" fill="#0f766e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="alerts" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-4">
            <p className="section-kicker">Geospatial View</p>
            <h2 className="section-title">Critical encroachment locations</h2>
          </div>
          <MapView center={[11.4, 78.1]} markers={mapMarkers} />
        </div>
        <div className="space-y-4">
          <div className="mb-4">
            <p className="section-kicker">Recent Cases</p>
            <h2 className="section-title">Latest report activity</h2>
          </div>
          {reportCards.slice(0, 2).map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
