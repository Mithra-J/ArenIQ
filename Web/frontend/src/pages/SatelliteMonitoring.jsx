import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MapView from "../components/MapView";
import SatellitePreview from "../components/SatellitePreview";
import StatusAlert from "../components/StatusAlert";
import { getReports } from "../services/supabaseClient";

const TYPE_COLORS = {
  construction: "#ef4444",
  sand_mining: "#f97316",
  waste_dumping: "#eab308",
  land_filling: "#3b82f6",
  other: "#8b5cf6",
};

const TYPE_LABELS = {
  construction: "Construction",
  sand_mining: "Sand Mining",
  waste_dumping: "Waste Dumping",
  land_filling: "Land Filling",
  other: "Other",
};

function buildDistrictData(reports) {
  // Group satellite reports by type for bar chart
  const typeCounts = {};
  reports
    .filter((r) => r.source === "satellite")
    .forEach((r) => {
      const t = r.type || "other";
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
  return Object.entries(typeCounts).map(([type, cases]) => ({
    district: TYPE_LABELS[type] || type,
    cases,
    type,
  }));
}

function buildMarkers(reports) {
  return reports
    .filter((r) => r.latitude && r.longitude)
    .map((r) => ({
      id: r.id,
      lat: r.latitude,
      lng: r.longitude,
      label: TYPE_LABELS[r.type] || r.type || "Encroachment",
      status: r.status,
      source: r.source,
      confidence: r.confidence,
    }));
}

function buildSatellitePreviews(reports) {
  return reports
    .filter((r) => r.source === "satellite" && r.image_url)
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      imageUrl: r.image_url,
      label: TYPE_LABELS[r.type] || r.type,
      confidence: r.confidence,
      date: new Date(r.created_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      }),
      status: r.status,
      location: r.location_name || `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}`,
    }));
}

function StatBadge({ label, value, color = "sky" }) {
  const colorMap = {
    sky: "bg-sky-50 text-sky-800 border-sky-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    rose: "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <div className={`rounded-2xl border px-5 py-4 ${colorMap[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide opacity-70">{label}</p>
    </div>
  );
}

function SatelliteMonitoring() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    async function load() {
      try {
        const data = await getReports();
        setReports(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const satelliteReports = reports.filter((r) => r.source === "satellite");
  const citizenReports = reports.filter((r) => r.source === "citizen");
  const pendingCount = reports.filter((r) => r.status === "pending").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  const districtStats = buildDistrictData(reports);

  // Filter markers by selected type
  const filteredReports =
    selectedType === "all"
      ? reports
      : selectedType === "satellite" || selectedType === "citizen"
      ? reports.filter((r) => r.source === selectedType)
      : reports.filter((r) => r.type === selectedType);

  const mapMarkers = buildMarkers(filteredReports);
  const satellitePreviews = buildSatellitePreviews(reports);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-sky-900/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        <p className="section-kicker">Satellite Monitoring</p>
        <h1 className="section-title">Interactive map and imagery inspection workspace</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Visualize flagged locations from both satellite detection and citizen reports. Data updates automatically when the NDWI pipeline runs.
        </p>
      </section>

      {error && (
        <StatusAlert
          title="Data Load Error"
          message={`Could not fetch live data: ${error}`}
          tone="error"
        />
      )}

      {/* Summary badges */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBadge label="Satellite Detections" value={satelliteReports.length} color="sky" />
          <StatBadge label="Citizen Reports" value={citizenReports.length} color="emerald" />
          <StatBadge label="Pending Action" value={pendingCount} color="amber" />
          <StatBadge label="Resolved" value={resolvedCount} color="rose" />
        </div>
      )}

      {/* Filter by type/source */}
      <div className="flex flex-wrap gap-2">
        {["all", "satellite", "citizen", ...Object.keys(TYPE_LABELS)].map((f) => (
          <button
            key={f}
            onClick={() => setSelectedType(f)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              selectedType === f
                ? "bg-sky-900 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {TYPE_LABELS[f] || f}
          </button>
        ))}
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-4">
            <p className="section-kicker">Leaflet Map</p>
            <h2 className="section-title">
              {loading ? "Loading markers…" : `${mapMarkers.length} live encroachment marker${mapMarkers.length !== 1 ? "s" : ""}`}
            </h2>
          </div>
          <MapView
            center={[12.7, 80.0]}
            markers={mapMarkers}
            height="500px"
          />
        </div>

        <div className="rounded-[28px] border border-sky-900/10 bg-white p-6 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]">
          <p className="section-kicker">By Encroachment Type</p>
          <h2 className="section-title">Satellite detection breakdown</h2>
          <div className="mt-6 h-80">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading…
              </div>
            ) : districtStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtStats} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis type="number" stroke="#475569" allowDecimals={false} />
                  <YAxis dataKey="district" type="category" stroke="#475569" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cases" radius={[0, 8, 8, 0]}>
                    {districtStats.map((entry) => (
                      <Cell
                        key={entry.type}
                        fill={TYPE_COLORS[entry.type] || "#0369a1"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No satellite reports yet. Run <code className="mx-1 rounded bg-slate-100 px-1">python ndwi_detection.py</code> to populate data.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Satellite image previews */}
      <section>
        <div className="mb-4">
          <p className="section-kicker">Satellite Preview</p>
          <h2 className="section-title">
            {satellitePreviews.length > 0
              ? "Recent NDWI detection panels"
              : "No satellite imagery uploaded yet"}
          </h2>
        </div>
        {satellitePreviews.length > 0 ? (
          <SatellitePreview previews={satellitePreviews} />
        ) : (
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <p className="text-sm text-slate-400">
              Satellite imagery will appear here after the NDWI detection pipeline runs and uploads images to Supabase Storage.
            </p>
            <code className="mt-3 inline-block rounded-lg bg-slate-100 px-4 py-2 text-xs text-slate-600">
              python ndwi_detection.py
            </code>
          </div>
        )}
      </section>
    </div>
  );
}

export default SatelliteMonitoring;