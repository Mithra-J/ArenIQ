function LoadingSpinner({ label = "Syncing dashboard feed" }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-900" />
      <span>{label}</span>
    </div>
  );
}

export default LoadingSpinner;
