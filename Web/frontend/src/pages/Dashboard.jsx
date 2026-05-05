import { useEffect, useState } from "react";
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
import { getReports, getStats } from "../services/supabaseClient";

function ChartPanel({ title, subtitle, children }) {
  return (
    <section className="min-w-0 rounded-[28px] border border-sky-900/10 bg-white p-6 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

// Build monthly trend data from real reports
function buildTrendData(reports) {
  const months = {};
  reports.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString("default", { month: "short", year: "2-digit" });
    if (!months[key]) months[key] = { month: key, detected: 0, resolved: 0 };
    months[key].detected += 1;
    if (r.status === "resolved") months[key].resolved += 1;
  });
  return Object.values(months).slice(-6);
}

// Build bar chart data grouped by source type
function buildMonitoringData(reports) {
  const periods = {};
  reports.forEach((r) => {
    const d = new Date(r.created_at);
    const key = d.toLocaleString("default", { month: "short" });
    if (!periods[key]) periods[key] = { period: key, scans: 0, alerts: 0 };
    if (r.source === "satellite") periods[key].scans += 1;
    else periods[key].alerts += 1;
  });
  return Object.values(periods).slice(-6);
}

// Convert reports to map markers
function buildMarkers(reports) {
  return reports
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      label: r.type || "Encroachment",
      status: r.status,
      source: r.source,
    }));
}

// Map DB report to ReportCard format
function toReportCard(r) {
  return {
    id: r.id,
    title: r.description?.slice(0, 60) || `${r.type} report`,
    type: r.type,
    status: r.status,
    location: r.location_name || `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`,
    date: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    source: r.source,
    confidence: r.confidence,
  };
}

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, resolved: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [fetchedReports, fetchedStats] = await Promise.all([
          getReports(),
          getStats(),
        ]);
        setReports(fetchedReports);
        setStats(fetchedStats);
        setLastSync(new Date().toLocaleString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        }));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const portalStats = [
    { label: "Total Detections", value: stats.total ?? 0, color: "sky" },
    { label: "Resolved Cases", value: stats.resolved ?? 0, color: "emerald" },
    { label: "Pending Review", value: stats.pending ?? 0, color: "amber" },
    {
      label: "Active Rate",
      value: stats.total ? `${Math.round(((stats.total - stats.resolved) / stats.total) * 100)}%` : "—",
      color: "rose",
    },
  ];

  const encroachmentTrend = buildTrendData(reports);
  const monthlyMonitoring = buildMonitoringData(reports);
  const mapMarkers = buildMarkers(reports);
  const reportCards = reports.map(toReportCard);

  // Critical reports = pending satellite reports
  const criticalReports = reports.filter(
    (r) => r.status === "pending" && r.source === "satellite"
  );

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
          <LoadingSpinner
            label={loading ? "Syncing live data…" : `Last sync: ${lastSync}`}
          />
        </div>
      </section>

      {error && (
        <StatusAlert
          title="Data Load Error"
          message={`Could not fetch live data: ${error}. Check your Supabase connection.`}
          tone="error"
        />
      )}

      <StatsPanel stats={portalStats} />

      {criticalReports.length > 0 && (
        <StatusAlert
          title="Priority Advisory"
          message={`${criticalReports.length} satellite-detected encroachment(s) are pending authority action.`}
          tone="error"
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          Loading live data from Supabase…
        </div>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ChartPanel
              title="Encroachment Trend"
              subtitle="Monthly comparison of detected encroachments and resolved actions."
            >
              <div className="h-80 min-w-0">
                {encroachmentTrend.length > 0 ? (
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
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No trend data yet — reports will appear here as they come in.
                  </div>
                )}
              </div>
            </ChartPanel>

            <ChartPanel
              title="Monthly Monitoring Load"
              subtitle="Satellite scans vs citizen alerts across the current cycle."
            >
              <div className="h-80 min-w-0">
                {monthlyMonitoring.length > 0 ? (
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
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    No monitoring data yet.
                  </div>
                )}
              </div>
            </ChartPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-4">
                <p className="section-kicker">Geospatial View</p>
                <h2 className="section-title">Live encroachment locations</h2>
              </div>
              <MapView
                center={[12.7, 80.0]}
                markers={mapMarkers}
              />
            </div>
            <div className="space-y-4">
              <div className="mb-4">
                <p className="section-kicker">Recent Cases</p>
                <h2 className="section-title">Latest report activity</h2>
              </div>
              {reportCards.length > 0 ? (
                reportCards.slice(0, 2).map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              ) : (
                <p className="text-sm text-slate-400">No reports yet.</p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;