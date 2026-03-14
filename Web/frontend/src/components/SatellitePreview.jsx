function SatellitePreview({ previews }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {previews.map((item) => (
        <article
          key={item.id}
          className="overflow-hidden rounded-[24px] border border-sky-900/10 bg-white shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]"
        >
          <div className={`h-48 bg-gradient-to-br ${item.gradient} p-5 text-white`}>
            <div className="flex h-full flex-col justify-between rounded-[20px] border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.25em] text-white/80">{item.sensor}</p>
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-white/80">{item.captureDate}</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <p className="text-sm leading-6 text-slate-600">{item.summary}</p>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-900">{item.district}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {item.priority}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export default SatellitePreview;
