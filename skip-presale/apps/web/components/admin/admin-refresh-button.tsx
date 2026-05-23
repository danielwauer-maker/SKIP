import { RefreshCw } from "lucide-react";

export function AdminRefreshButton({
  onRefresh,
  loading,
  lastRefreshed
}: {
  onRefresh: () => void;
  loading: boolean;
  lastRefreshed?: Date;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={onRefresh}
        disabled={loading}
        className="focus-ring inline-flex items-center gap-2 rounded-md border border-line px-4 py-2 text-sm font-semibold text-white hover:border-neon disabled:opacity-50"
      >
        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        Refresh
      </button>
      <span className="text-xs text-slate-500">
        Last refreshed: {lastRefreshed ? lastRefreshed.toLocaleTimeString() : "not yet"}
      </span>
    </div>
  );
}
