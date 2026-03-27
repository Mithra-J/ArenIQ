// src/pages/Dashboard.jsx
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
import {
  fetchReports,
  acknowledgeReport,
  resolveReport,
} from "../services/api";

// Keep your mock data only for charts (you can replace these later with real aggregated data)
import {
  encroachmentTrend,
  mapMarkers,
  monthlyMonitoring,
  portalStats,
} from "../data/mockData";

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

function Dashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real reports from backend
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await fetchReports();
        setReports(data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load reports:", err);
        setError("Failed to load reports from server. Showing demo data.");
        // Fallback to mock only if you want (optional)
        // setReports(reportCards);
      } finally {
        setLoading(false);
      }
    };

    loadReports();

    // Optional: refresh every 30 seconds for "live" feel
    const interval = setInterval(loadReports, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handler for Acknowledge button
  const handleAcknowledge = async (reportId) => {
    try {
      await acknowledgeReport(reportId);
      // Refresh list after action
      const updated = await fetchReports();
      setReports(updated);
    } catch (err) {
      alert("Failed to acknowledge report");
      console.error(err);
    }
  };

  // Handler for Resolve button
  const handleResolve = async (reportId) => {
    try {
      await resolveReport(reportId);
      const updated = await fetchReports();
      setReports(updated);
    } catch (err) {
      alert("Failed to resolve report");
      console.error(err);
    }
  };

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

      {error && (
        <StatusAlert title="Connection Issue" message={error} tone="error" />
      )}

      {loading ? (
        <div className="text-center py-12">
          <LoadingSpinner label="Loading real-time reports..." />
        </div>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <ChartPanel
              title="Encroachment Trend"
              subtitle="Monthly comparison of detected encroachments and resolved actions."
            >
              <div className="h-80 min-w-0">
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
              <div className="h-80 min-w-0">
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

              {reports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No recent reports yet. Submit one to see live data.
                </div>
              ) : (
                reports.slice(0, 4).map((report) => (   // show latest 4
                  <ReportCard
                    key={report.id}
                    report={{
                      ...report,
                      // Map backend fields to what ReportCard expects
                      category: report.source?.toUpperCase() || "Unknown",
                      location: report.location_name || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`,
                      description: report.description,
                      status: report.status?.charAt(0).toUpperCase() + report.status?.slice(1),
                      reportedBy: report.user_id ? "User" : "System (Satellite)",
                      date: new Date(report.created_at).toLocaleDateString(),
                      photo: report.image_url ? "View" : null,
                      // Extra fields for new UI
                      severity_label: report.severity_label,
                      severity_score: report.severity_score,
                      escalation_level: report.escalation_level || 1,
                    }}
                    actions={
                      report.status === "pending" && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={() => handleAcknowledge(report.id)}
                            className="btn-primary px-5 py-2 text-sm"
                          >
                            Acknowledge
                          </button>
                          <button
                            onClick={() => handleResolve(report.id)}
                            className="btn-secondary px-5 py-2 text-sm"
                          >
                            Resolve
                          </button>
                        </div>
                      )
                    }
                  />
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;