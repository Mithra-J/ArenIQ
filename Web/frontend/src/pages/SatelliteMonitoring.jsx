import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import MapView from "../components/MapView";
import SatellitePreview from "../components/SatellitePreview";
import { districtStats, mapMarkers, satellitePreviews } from "../data/mockData";

function SatelliteMonitoring() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-sky-900/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        <p className="section-kicker">Satellite Monitoring</p>
        <h1 className="section-title">Interactive map and imagery inspection workspace</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Visualize flagged locations, compare imagery-derived insights, and prioritize districts by case load.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <div className="mb-4">
            <p className="section-kicker">Leaflet Map</p>
            <h2 className="section-title">Detected encroachment markers</h2>
          </div>
          <MapView center={[11.4, 78.1]} markers={mapMarkers} height="500px" />
        </div>
        <div className="rounded-[28px] border border-sky-900/10 bg-white p-6 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]">
          <p className="section-kicker">District Statistics</p>
          <h2 className="section-title">Current monitoring distribution</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtStats} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis type="number" stroke="#475569" />
                <YAxis dataKey="district" type="category" stroke="#475569" width={90} />
                <Tooltip />
                <Bar dataKey="cases" fill="#0369a1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="section-kicker">Satellite Preview</p>
          <h2 className="section-title">Recent observation panels</h2>
        </div>
        <SatellitePreview previews={satellitePreviews} />
      </section>
    </div>
  );
}

export default SatelliteMonitoring;
