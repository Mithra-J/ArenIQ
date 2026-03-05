import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import Login from './pages/Login';
import Dashboard from './DashBoard'    // rename your current App.jsx content to Dashboard.jsx

// Optional: later add map
// import { MapContainer, TileLayer, Marker } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

function App() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchReports = async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setReports(data || []);
      setLoading(false);
    };

    fetchReports();

    // Realtime subscription
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          console.log('Change received!', payload);
          // Simple approach: refetch all (good for small data)
          fetchReports();
          // Or update state incrementally (more efficient)
          // if (payload.eventType === 'INSERT') setReports(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="dashboard">
      <header>
        <h1>ArenIQ — Waterbody Encroachment Dashboard</h1>
        <p>Satellite + Citizen reports for Chengalpattu District</p>
      </header>

      <main>
        {loading ? (
          <p>Loading reports...</p>
        ) : reports.length === 0 ? (
          <p>No encroachments reported yet.</p>
        ) : (
          <div className="reports-grid">
            {reports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <span className={`status ${report.status}`}>
                    {report.status.toUpperCase()}
                  </span>
                  <span className="source">{report.source.toUpperCase()}</span>
                </div>
                <h3>{report.type || 'Encroachment'}</h3>
                <p>{report.description || 'Auto-detected change'}</p>
                <p className="location">
                  📍 {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                </p>
                {report.image_url && (
                  <img
                    src={report.image_url}
                    alt="Evidence"
                    style={{ maxWidth: '100%', borderRadius: '8px' }}
                  />
                )}
                <small>
                  {new Date(report.created_at).toLocaleString()}
                </small>
              </div>
            ))}
          </div>
        )}

        {/* Future: Stats + Map */}
        {/* <div className="stats">
          <div>Total Detected: {reports.length}</div>
        </div>
        <MapContainer center={[12.7, 80.0]} zoom={10} style={{ height: '400px' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {reports.map(r => r.latitude && (
            <Marker position={[r.latitude, r.longitude]} key={r.id} />
          ))}
        </MapContainer> */}
      </main>
    </div>
  );
}

export default App;