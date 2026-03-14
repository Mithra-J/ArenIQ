import DataTable from "../components/DataTable";
import ReportCard from "../components/ReportCard";
import StatsPanel from "../components/StatsPanel";
import { adminRows, portalStats, reportCards } from "../data/mockData";

function AdminPanel() {
  const columns = [
    { key: "district", label: "District" },
    { key: "officer", label: "Responsible Officer" },
    { key: "pending", label: "Pending Cases" },
    { key: "approved", label: "Approved Actions" },
    { key: "resolutionRate", label: "Resolution Rate" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-sky-900/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)]">
        <p className="section-kicker">Administrative Command</p>
        <h1 className="section-title">Approval and case management console</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Review district performance, validate reports, and control enforcement actions from a single panel.
        </p>
      </section>

      <StatsPanel stats={portalStats} />

      <section className="space-y-4">
        <div>
          <p className="section-kicker">Reports Queue</p>
          <h2 className="section-title">Approve or reject encroachment cases</h2>
        </div>
        {reportCards.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            actions={
              <>
                <button type="button" className="btn-primary">
                  Approve
                </button>
                <button type="button" className="btn-secondary">
                  Reject
                </button>
              </>
            }
          />
        ))}
      </section>

      <section>
        <div className="mb-4">
          <p className="section-kicker">District Statistics</p>
          <h2 className="section-title">Officer-wise operational dashboard</h2>
        </div>
        <DataTable columns={columns} rows={adminRows} />
      </section>
    </div>
  );
}

export default AdminPanel;
