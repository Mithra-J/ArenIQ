import EmptyState from "../components/EmptyState";
import ReportCard from "../components/ReportCard";
import StatusAlert from "../components/StatusAlert";
import { reportCards } from "../data/mockData";

function Reports() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-sky-900/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        <p className="section-kicker">Encroachment Reporting</p>
        <h1 className="section-title">Report an encroachment event</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Collect structured public inputs with location details, image evidence, and incident description.
        </p>

        <form className="mt-8 grid gap-5 lg:grid-cols-2">
          <label className="form-field">
            <span>Location</span>
            <input type="text" placeholder="Enter waterbody location" className="input-field" />
          </label>
          <label className="form-field">
            <span>Photo Upload</span>
            <input type="file" className="input-field file:mr-4 file:rounded-full file:border-0 file:bg-sky-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700" />
          </label>
          <label className="form-field lg:col-span-2">
            <span>Description</span>
            <textarea
              rows="5"
              placeholder="Describe the nature of the encroachment, nearby landmarks, and any urgency."
              className="input-field min-h-[140px]"
            />
          </label>
          <div className="flex flex-wrap gap-4 lg:col-span-2">
            <button type="submit" className="btn-primary">
              Submit Report
            </button>
            <button type="reset" className="btn-secondary">
              Clear Form
            </button>
          </div>
        </form>
      </section>

      <StatusAlert
        title="Submission Workflow"
        message="New reports are marked pending, reviewed by district officers, and escalated when satellite evidence matches field observations."
        tone="success"
      />

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
