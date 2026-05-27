import { AlertTriangle, CheckCircle2, FileSearch, ShieldCheck } from "lucide-react";
import { launchStatusItems, trustStatusSummary, type LaunchStatusIcon } from "../lib/launch-status";

const icons: Record<LaunchStatusIcon, typeof AlertTriangle> = {
  check: CheckCircle2,
  audit: FileSearch,
  shield: ShieldCheck,
  warning: AlertTriangle
};

export function TrustStatusPanel() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 max-w-3xl">
        <h2 className="text-3xl font-black text-white">Launch Readiness Status</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">{trustStatusSummary}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {launchStatusItems.map(({ label, status, tone, icon }) => {
          const Icon = icons[icon];
          return (
          <div key={label} className="rounded-lg border border-line bg-black/30 p-4">
            <Icon className={tone === "ok" ? "text-neon" : "text-amber-200"} size={20} />
            <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
            <div className={tone === "ok" ? "mt-2 font-semibold text-neon" : "mt-2 font-semibold text-amber-100"}>
              {status}
            </div>
          </div>
          );
        })}
      </div>
    </section>
  );
}
