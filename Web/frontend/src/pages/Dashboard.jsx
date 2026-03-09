// src/pages/Dashboard.jsx
// TEAM NOTE: Full dashboard with actions, filters, stats. Calls backend for updates.
// Install: npm i react-hot-toast axios (for API calls)

import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';  // TEAM NOTE: For backend API calls[](http://localhost:5000)
import { toast } from 'react-hot-toast';  // TEAM NOTE: For user feedback

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, resolved: 0, critical: 0 });
  const [filter, setFilter] = useState('all');  // 'all', 'satellite', 'citizen'

  // Backend API base URL
  const API_URL = 'http://localhost:5000';  // TEAM NOTE: Update for prod (e.g., Heroku)

  useEffect(() => {
    fetchReports();
    fetchStats();

    const channel = supabase
      .channel('reports-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchReports();
        fetchStats();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) {
      setReports(data || []);
      applyFilter(data || []);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports/stats`);
      setStats(res.data);
    } catch (err) {
      console.error('Stats fetch failed:', err);
    }
  };

  const applyFilter = (data) => {
    let filtered = data;
    if (filter === 'satellite') filtered = data.filter(r => r.source === 'satellite');
    if (filter === 'citizen') filtered = data.filter(r => r.source === 'citizen');
    setFilteredReports(filtered);
  };

  const handleFilter = (newFilter) => {
    setFilter(newFilter);
    applyFilter(reports);
  };

  // TEAM NOTE: API calls for actions
  const updateReportStatus = async (id, newStatus) => {
    try {
      const endpoint = newStatus === 'acknowledged' ? 'acknowledge' : 'resolve';
      const res = await axios.put(`${API_URL}/reports/${id}/${endpoint}`);
      toast.success(`Report ${newStatus}!`);  // Success toast
      fetchReports();  // Refresh list
    } catch (err) {
      toast.error('Update failed — check console');
      console.error('Update error:', err);
    }
  };

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>;

  return (
    <div className="dashboard">
      <header>
        <h1>ArenIQ — Waterbody Encroachment Dashboard</h1>
        <p>Satellite + Citizen reports for Chengalpattu District</p>
        <p>Welcome, {user?.email || 'Official'} | <button onClick={signOut}>Sign Out</button></p>
      </header>

      <main>
        {/* Stats Cards (now from backend API) */}
        <div className="stats-row">
          <div className="stat-card">
            <strong>Total Reports</strong>
            <span>{stats.total}</span>
          </div>
          <div className="stat-card resolved">
            <strong>Resolved</strong>
            <span>{stats.resolved}</span>
          </div>
          <div className="stat-card pending">
            <strong>Pending</strong>
            <span>{reports.filter(r => r.status === 'pending').length}</span>
          </div>
          <div className="stat-card satellite">
            <strong>Satellite</strong>
            <span>{reports.filter(r => r.source === 'satellite').length}</span>
          </div>
        </div>

        {/* NEW: Filter Buttons */}
        <div className="filter-buttons">
          {['all', 'satellite', 'citizen'].map(f => (
            <button
              key={f}
              className={filter === f ? 'active' : ''}
              onClick={() => handleFilter(f)}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>

        {filteredReports.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No reports matching filter.
          </p>
        ) : (
          <div className="reports-grid">
            {filteredReports.map((report) => (
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
                  <img src={report.image_url} alt="Evidence" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                )}
                <small className="timestamp">
                  {new Date(report.created_at).toLocaleString()}
                </small>

                {/* NEW: Action Buttons (only for pending/acknowledged) */}
                {(report.status === 'pending' || report.status === 'acknowledged') && (
                  <div className="actions">
                    <button
                      className="btn acknowledge"
                      onClick={() => updateReportStatus(report.id, 'acknowledged')}
                    >
                      Acknowledge
                    </button>
                    <button
                      className="btn in-progress"
                      onClick={() => updateReportStatus(report.id, 'in-progress')}
                    >
                      In Progress
                    </button>
                    <button
                      className="btn resolve"
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                    >
                      Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Map (unchanged) */}
        <div style={{ marginTop: '3rem' }}>
          <h2>Encroachment Locations</h2>
          <MapContainer center={[12.68, 80.0]} zoom={10} style={{ height: '500px', width: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {filteredReports
              .filter(r => r.latitude && r.longitude)
              .map(r => (
                <Marker key={r.id} position={[r.latitude, r.longitude]}>
                  <Popup>
                    <strong>{r.type}</strong><br />
                    Status: {r.status}<br />
                    {r.description}<br />
                    Source: {r.source}
                  </Popup>
                </Marker>
              ))}
          </MapContainer>
        </div>
      </main>
    </div>
  );
}