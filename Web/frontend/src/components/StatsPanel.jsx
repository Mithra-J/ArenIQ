function StatsPanel({ stats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <article
          key={item.label}
          className="group rounded-[24px] border border-sky-900/10 bg-white p-5 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_-28px_rgba(3,105,161,0.35)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{item.value}</p>
            </div>
            <div className={`rounded-2xl px-3 py-2 text-xs font-semibold ${item.tone}`}>
              {item.change}
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{item.description}</p>
        </article>
      ))}
    </div>
  );
}

export default StatsPanel;
