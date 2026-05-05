import { useEffect, useState } from "react";
import EmptyState from "../components/EmptyState";
import ReportCard from "../components/ReportCard";
import StatusAlert from "../components/StatusAlert";
import {
  reverseGeocode,
  submitEncroachmentReport,
  uploadPhoto,
} from "../services/api";
import { getCurrentSession, getReports, approveReport, rejectReport } from "../services/supabaseClient";

// Map DB report → ReportCard format
function toReportCard(r) {
  return {
    id: r.id,
    title: r.description?.slice(0, 60) || `${r.type || "Unknown"} report`,
    type: r.type,
    status: r.status,
    location: r.location_name || (r.latitude ? `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(4)}` : "Unknown location"),
    date: new Date(r.created_at).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    }),
    source: r.source,
    confidence: r.confidence,
    image_url: r.image_url,
  };
}

const ENCROACHMENT_TYPES = [
  "Construction",
  "Sand Mining",
  "Waste Dumping",
  "Land Filling",
  "Other",
];

function Reports() {
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    latitude: "",
    longitude: "",
    type: ENCROACHMENT_TYPES[0],
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live report list
  const [reports, setReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [filter, setFilter] = useState("all"); // all | pending | resolved | satellite | citizen

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    setLoadingReports(true);
    try {
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoadingReports(false);
    }
  }

  async function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setFeedback({ tone: "error", title: "Location Unavailable", message: "Browser geolocation is not supported." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const geocode = await reverseGeocode({ latitude, longitude });
        setFormData((c) => ({
          ...c, latitude, longitude,
          location: geocode.display_name || c.location,
        }));
      },
      () => {
        setFeedback({ tone: "error", title: "Location Access Denied", message: "Please allow browser location access to autofill coordinates." });
      },
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);
    try {
      const session = await getCurrentSession();
      let imageUrl = "";
      if (selectedFile) {
        const upload = await uploadPhoto({ file: selectedFile });
        imageUrl = upload.publicUrl;
      }
      await submitEncroachmentReport({
        title: `Citizen report - ${formData.location || "Unknown location"}`,
        description: formData.description,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        locationName: formData.location,
        type: formData.type,
        imageUrl,
        userId: session?.user?.id,
        source: "citizen",
      });
      setFeedback({
        tone: "success",
        title: "Report Submitted",
        message: "Your encroachment report has been stored and forwarded to the local authority.",
      });
      setFormData({ location: "", description: "", latitude: "", longitude: "", type: ENCROACHMENT_TYPES[0] });
      setSelectedFile(null);
      // Reload report list to show new entry
      await loadReports();
    } catch (error) {
      setFeedback({
        tone: "error",
        title: "Submission Failed",
        message: error.response?.data?.error || error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(id) {
    await approveReport(id);
    setReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "resolved" } : r)
    );
  }

  async function handleReject(id) {
    await rejectReport(id);
    setReports((prev) =>
      prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r)
    );
  }

  const filteredReports = reports.filter((r) => {
    if (filter === "all") return true;
    if (filter === "satellite") return r.source === "satellite";
    if (filter === "citizen") return r.source === "citizen";
    return r.status === filter;
  });

  const reportCards = filteredReports.map(toReportCard);

  return (
    <div className="space-y-6">
      {/* Submit Form */}
      <section className="rounded-[32px] border border-sky-900/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        <p className="section-kicker">Encroachment Reporting</p>
        <h1 className="section-title">Report an encroachment event</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Collect structured public inputs with location details, image evidence, and incident description.
        </p>

        <form className="mt-8 grid gap-5 lg:grid-cols-2" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Location</span>
            <input
              type="text"
              placeholder="Enter waterbody location"
              className="input-field"
              value={formData.location}
              onChange={(e) => setFormData((c) => ({ ...c, location: e.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>Encroachment Type</span>
            <select
              className="input-field"
              value={formData.type}
              onChange={(e) => setFormData((c) => ({ ...c, type: e.target.value }))}
            >
              {ENCROACHMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Photo Upload</span>
            <input
              type="file"
              accept="image/*"
              className="input-field file:mr-4 file:rounded-full file:border-0 file:bg-sky-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </label>
          <label className="form-field">
            <span>Latitude</span>
            <input
              type="number"
              step="any"
              placeholder="12.693000"
              className="input-field"
              value={formData.latitude}
              onChange={(e) => setFormData((c) => ({ ...c, latitude: e.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>Longitude</span>
            <input
              type="number"
              step="any"
              placeholder="80.004000"
              className="input-field"
              value={formData.longitude}
              onChange={(e) => setFormData((c) => ({ ...c, longitude: e.target.value }))}
            />
          </label>
          <label className="form-field lg:col-span-2">
            <span>Description</span>
            <textarea
              rows="5"
              placeholder="Describe the nature of the encroachment, nearby landmarks, and any urgency."
              className="input-field min-h-[140px]"
              value={formData.description}
              onChange={(e) => setFormData((c) => ({ ...c, description: e.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-4 lg:col-span-2">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting…" : "Submit Report"}
            </button>
            <button type="button" className="btn-secondary" onClick={handleUseCurrentLocation}>
              Use Current Location
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({ location: "", description: "", latitude: "", longitude: "", type: ENCROACHMENT_TYPES[0] });
                setSelectedFile(null);
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </section>

      {feedback ? (
        <StatusAlert title={feedback.title} message={feedback.message} tone={feedback.tone} />
      ) : (
        <StatusAlert
          title="Submission Workflow"
          message="New reports are marked pending, reviewed by district officers, and escalated when satellite evidence matches field observations."
          tone="success"
        />
      )}

      {/* Live Report List */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Live Reports</p>
            <h2 className="section-title">All citizen and satellite submissions</h2>
          </div>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {["all", "pending", "resolved", "satellite", "citizen"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                  filter === f
                    ? "bg-sky-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loadingReports ? (
          <div className="py-12 text-center text-sm text-slate-400">Loading reports from Supabase…</div>
        ) : reportCards.length === 0 ? (
          <EmptyState
            title="No reports found"
            description={
              filter === "all"
                ? "No reports in the database yet. Submit one above or run the satellite detection script."
                : `No reports with filter "${filter}".`
            }
          />
        ) : (
          <div className="space-y-4">
            {reportCards.map((report) => (
              <div key={report.id} className="relative">
                <ReportCard report={report} />
                {/* Inline action buttons for pending reports */}
                {report.status === "pending" && (
                  <div className="mt-2 flex gap-2 pl-2">
                    <button
                      onClick={() => handleApprove(report.id)}
                      className="rounded-full bg-emerald-700 px-4 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleReject(report.id)}
                      className="rounded-full border border-rose-300 px-4 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Reports;