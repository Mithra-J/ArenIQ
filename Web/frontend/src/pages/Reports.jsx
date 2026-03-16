import { useState } from "react";
import EmptyState from "../components/EmptyState";
import ReportCard from "../components/ReportCard";
import StatusAlert from "../components/StatusAlert";
import {
  reverseGeocode,
  submitEncroachmentReport,
  uploadPhoto,
} from "../services/api";
import { reportCards } from "../data/mockData";
import { getCurrentSession } from "../services/supabaseClient";

function Reports() {
  const [formData, setFormData] = useState({
    location: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        setFormData((current) => ({
          ...current,
          latitude,
          longitude,
          location: geocode.display_name || current.location,
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
        imageUrl,
        userId: session?.user?.id,
        source: "citizen",
      });

      setFeedback({
        tone: "success",
        title: "Report Submitted",
        message: "Your encroachment report has been stored in Supabase and forwarded to the backend workflow.",
      });
      setFormData({ location: "", description: "", latitude: "", longitude: "" });
      setSelectedFile(null);
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

  return (
    <div className="space-y-6">
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
              onChange={(event) => setFormData((current) => ({ ...current, location: event.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>Photo Upload</span>
            <input
              type="file"
              className="input-field file:mr-4 file:rounded-full file:border-0 file:bg-sky-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="form-field">
            <span>Latitude</span>
            <input
              type="number"
              step="any"
              placeholder="13.038000"
              className="input-field"
              value={formData.latitude}
              onChange={(event) => setFormData((current) => ({ ...current, latitude: event.target.value }))}
            />
          </label>
          <label className="form-field">
            <span>Longitude</span>
            <input
              type="number"
              step="any"
              placeholder="80.154000"
              className="input-field"
              value={formData.longitude}
              onChange={(event) => setFormData((current) => ({ ...current, longitude: event.target.value }))}
            />
          </label>
          <label className="form-field lg:col-span-2">
            <span>Description</span>
            <textarea
              rows="5"
              placeholder="Describe the nature of the encroachment, nearby landmarks, and any urgency."
              className="input-field min-h-[140px]"
              value={formData.description}
              onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
            />
          </label>
          <div className="flex flex-wrap gap-4 lg:col-span-2">
            <button type="submit" className="btn-primary">
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
            <button type="button" className="btn-secondary" onClick={handleUseCurrentLocation}>
              Use Current Location
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setFormData({ location: "", description: "", latitude: "", longitude: "" });
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

      <section className="space-y-4">
        <div>
          <p className="section-kicker">Recent Reports</p>
          <h2 className="section-title">Citizen and field submissions</h2>
        </div>
        {reportCards.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </section>

      <EmptyState
        title="No archived reports loaded"
        description="Connect this page to your backend API to populate historical complaint records and upload metadata."
      />
    </div>
  );
}

export default Reports;
