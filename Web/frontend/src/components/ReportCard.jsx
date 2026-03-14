function ReportCard({ report, actions }) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-800">
            {report.category}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{report.location}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{report.description}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            report.status === "Approved"
              ? "bg-emerald-100 text-emerald-700"
              : report.status === "Rejected"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
          }`}
        >
          {report.status}
        </span>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reported By</p>
          <p className="mt-1 font-medium text-slate-900">{report.reportedBy}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date</p>
          <p className="mt-1 font-medium text-slate-900">{report.date}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Evidence</p>
          <p className="mt-1 font-medium text-slate-900">{report.photo}</p>
        </div>
      </div>

      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </article>
  );
}

export default ReportCard;
