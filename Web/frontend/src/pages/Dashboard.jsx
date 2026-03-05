// src/pages/Dashboard.jsx  (all dashboard logic + UI moved here)
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import '../App.css';  // or create a separate Dashboard.css if preferred
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Dashboard() {
  const { session, signOut } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!session) return;

    const fetchReports = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) {
        setReports(data || []);
      } else {
        console.error('Error fetching reports:', error);
        toast.error('Failed to load reports');
      }
      setLoading(false);
    };

    fetchReports();

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const updateStatus = async (id, newStatus, notes = '') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          internal_notes: notes || null,
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Report updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status: ' + err.message);
    }
  };

  // Simple govt email check (replace with profiles + RLS later)
  const userEmail = session?.user?.email || '';
  const isAuthorized =
    userEmail.endsWith('@tn.gov.in') ||
    userEmail.endsWith('@chengalpattu.nic.in') ||
    userEmail.includes('government') ||
    userEmail.includes('@gmail.com'); // ← remove in production!

  if (!isAuthorized) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h2>Access Restricted</h2>
        <p>This dashboard is only for authorized government officials.</p>
        <p>Your email: <strong>{userEmail}</strong></p>
        <button
          onClick={signOut}
          style={{
            marginTop: '24px',
            padding: '12px 28px',
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            cursor: 'pointer'
          }}
        >
          Sign Out
        </button>
      </div>
    );
  }

  const filteredReports = reports.filter(
    (r) => statusFilter === 'all' || r.status?.toLowerCase() === statusFilter
  );

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status?.toLowerCase() === 'pending').length,
    resolved: reports.filter((r) => r.status?.toLowerCase() === 'resolved').length,
    satellite: reports.filter((r) => r.source?.toLowerCase() === 'satellite').length
  };

  // Custom marker icons by status
  const getStatusIcon = (status) => {
    const colors = {
      pending: '#f6e05e',
      acknowledged: '#ed8936',
      'in-progress': '#4299e1',
      resolved: '#48bb78',
      rejected: '#f56565'
    };
    const color = colors[status?.toLowerCase()] || '#a0aec0';

    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        background-color:${color};
        width:28px;
        height:28px;
        border-radius:50%;
        border:4px solid white;
        box-shadow:0 3px 8px rgba(0,0,0,0.4);
      "></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });
  };

  return (
    <div className="dashboard">
      <header>
        <h1>ArenIQ — Waterbody Encroachment Dashboard</h1>
        <p>Satellite + Citizen reports for Chengalpattu District</p>

        <button
          onClick={signOut}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            padding: '10px 20px',
            background: '#e53e3e',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          Sign Out
        </button>
      </header>

      <main>
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card"><strong>Total</strong><span>{stats.total}</span></div>
          <div className="stat-card pending"><strong>Pending</strong><span>{stats.pending}</span></div>
          <div className="stat-card resolved"><strong>Resolved</strong><span>{stats.resolved}</span></div>
          <div className="stat-card satellite"><strong>Satellite</strong><span>{stats.satellite}</span></div>
        </div>

        {/* Map with colored markers */}
        <h2 style={{ textAlign: 'center', margin: '32px 0 12px' }}>Reported Locations</h2>
        <MapContainer
          center={[12.69, 79.98]}
          zoom={10}
          style={{ height: '420px', width: '100%', borderRadius: '10px', marginBottom: '32px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {filteredReports
            .filter((r) => r.latitude && r.longitude)
            .map((report) => (
              <Marker
                key={report.id}
                position={[report.latitude, report.longitude]}
                icon={getStatusIcon(report.status)}
              >
                <Popup>
                  <strong>{report.type || 'Encroachment'}</strong><br />
                  {report.description || 'Auto-detected change'}<br /><br />
                  <strong>Status:</strong> {(report.status || 'PENDING').toUpperCase()}<br />
                  Source: {report.source || '—'}<br />
                  Reported: {new Date(report.created_at).toLocaleDateString()}
                </Popup>
              </Marker>
            ))}
        </MapContainer>

        {/* Filters */}
        <div className="filter-buttons">
          {['all', 'pending', 'acknowledged', 'in-progress', 'resolved', 'rejected'].map((s) => (
            <button
              key={s}
              className={statusFilter === s ? 'active' : ''}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All Reports' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Loader2 className="animate-spin mx-auto mb-4" size={48} />
            <p style={{ fontSize: '1.1rem', color: '#4a5568' }}>
              Loading latest reports...
            </p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f8fafc',
            borderRadius: '12px',
            margin: '20px 0'
          }}>
            <h3 style={{ marginBottom: '12px', color: '#4a5568' }}>
              No reports found
            </h3>
            <p style={{ color: '#718096' }}>
              {statusFilter !== 'all'
                ? `No ${statusFilter} encroachments at the moment.`
                : 'No encroachments reported or detected yet in Chengalpattu.'}
            </p>
          </div>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <span className={`status ${report.status?.toLowerCase() || 'pending'}`}>
                    {(report.status || 'PENDING').toUpperCase()}
                  </span>
                  <span className="source">
                    {(report.source || 'UNKNOWN').toUpperCase()}
                  </span>
                </div>

                <h3>{report.type || 'Encroachment'}</h3>
                <p>{report.description || 'Auto-detected change'}</p>

                <p className="location">
                  📍 {report.latitude ? report.latitude.toFixed(5) : '—'},{' '}
                  {report.longitude ? report.longitude.toFixed(5) : '—'}
                </p>

                {report.image_url && (
                  <img
                    src={report.image_url}
                    alt="Evidence"
                    style={{ maxWidth: '100%', borderRadius: '8px', margin: '12px 0' }}
                    onError={(e) => (e.target.src = 'https://via.placeholder.com/340x200?text=Image+Not+Available')}
                  />
                )}

                {report.internal_notes && (
                  <div className="notes">
                    <strong>Officer note:</strong> {report.internal_notes}
                  </div>
                )}

                <small className="timestamp">
                  Reported: {new Date(report.created_at).toLocaleString()}
                  {report.updated_at && report.updated_at !== report.created_at && (
                    <> • Updated: {new Date(report.updated_at).toLocaleString()}</>
                  )}
                </small>

                {['pending', 'acknowledged'].includes(report.status?.toLowerCase() || '') && (
                  <div className="actions">
                    <button className="btn acknowledge" onClick={() => updateStatus(report.id, 'acknowledged')}>
                      Acknowledge
                    </button>
                    <button className="btn in-progress" onClick={() => updateStatus(report.id, 'in-progress')}>
                      In Progress
                    </button>
                    <button
                      className="btn reject"
                      onClick={() => {
                        const notes = prompt('Reason / note for rejection:');
                        if (notes !== null) updateStatus(report.id, 'rejected', notes);
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}