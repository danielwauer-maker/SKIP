"use client";

import { useEffect, useState } from "react";
import { compactAddress } from "../../lib/format";

type AdminReferralSummary = {
  totals: {
    totalUsers: number;
    totalRegisteredWallets: number;
    totalReferralClicks: number;
    totalReferrals: number;
    qualifiedReferrals: number;
    pendingReferrals: number;
    xpIssuedTotal: number;
    clickToRegistrationRate: number;
    registrationToQualifiedRate: number;
  };
  topUsers: Array<{
    walletAddress: string;
    referralCode: string;
    xpTotal: number;
    rank: string;
    referralCount: number;
    qualifiedReferralCount: number;
    isOgFounder: boolean;
  }>;
  topReferrers: Array<{
    walletAddress: string;
    referralCode: string;
    xpTotal: number;
    rank: string;
    referralCount: number;
    qualifiedReferralCount: number;
    isOgFounder: boolean;
  }>;
  suspicious: Array<{
    walletAddress: string;
    referralCode: string;
    referredCount: number;
    qualifiedCount: number;
    flags: string[];
    isBanned: boolean;
  }>;
};

export function AdminReferralPanel() {
  const [summary, setSummary] = useState<AdminReferralSummary>();
  const [adminSecret, setAdminSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadSummary(secret = adminSecret) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/referral/admin", {
        headers: secret ? { "x-admin-secret": secret } : undefined
      });
      const json = (await response.json()) as AdminReferralSummary & { error?: string };
      if (!response.ok) throw new Error(json.error || "Could not load referral admin data.");
      setSummary(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load referral admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadCsv(exportType: "users" | "referrals" | "xp") {
    setExportError(null);
    try {
      const response = await fetch(`/api/referral/admin?export=${exportType}`, {
        headers: adminSecret ? { "x-admin-secret": adminSecret } : undefined
      });
      if (!response.ok) {
        const json = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(json.error || "CSV export failed. Enter the Admin API Secret if one is configured.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `skip-${exportType}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setExportError(downloadError instanceof Error ? downloadError.message : "CSV export failed.");
    }
  }

  useEffect(() => {
    void loadSummary("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = summary?.totals;

  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        Growth data is a community reputation system. Admin access is local/dev unless REFERRAL_ADMIN_SECRET is configured.
      </div>
      <div className="glass rounded-lg p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Growth Command Center</h2>
            <p className="mt-1 text-sm text-slate-400">Referral, XP and OG Founder analytics.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={adminSecret}
              onChange={(event) => setAdminSecret(event.target.value)}
              className="rounded-md border border-line bg-black/40 px-3 py-2 text-sm text-white"
              placeholder="Admin API Secret"
            />
            <button onClick={() => void loadSummary()} disabled={loading} className="rounded-md bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>
        {error ? <div className="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total Users" value={totals?.totalUsers ?? 0} />
        <Metric label="Referral Clicks" value={totals?.totalReferralClicks ?? 0} />
        <Metric label="Registered Wallets" value={totals?.totalRegisteredWallets ?? 0} />
        <Metric label="Total Referrals" value={totals?.totalReferrals ?? 0} />
        <Metric label="Qualified Referrals" value={totals?.qualifiedReferrals ?? 0} />
        <Metric label="Pending Referrals" value={totals?.pendingReferrals ?? 0} />
        <Metric label="XP Issued" value={totals?.xpIssuedTotal ?? 0} />
        <Metric label="Clicks to Registrations" value={`${(((totals?.clickToRegistrationRate ?? 0) * 100)).toFixed(1)}%`} />
        <Metric label="Registrations to Qualified" value={`${(((totals?.registrationToQualifiedRate ?? 0) * 100)).toFixed(1)}%`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Table title="Top XP Wallets" rows={summary?.topUsers || []} mode="xp" />
        <Table title="Top Referrers" rows={summary?.topReferrers || []} mode="referrer" />
      </div>

      <div className="glass rounded-lg p-6">
        <h3 className="text-xl font-bold text-white">Suspicious Referral Codes</h3>
        <div className="mt-4 grid gap-3">
          {summary?.suspicious.length ? (
            summary.suspicious.map((item) => (
              <div key={item.referralCode} className="rounded-md border border-line bg-black/30 p-4 text-sm text-slate-300">
                <div className="font-semibold text-white">{item.referralCode} - {item.walletAddress}</div>
                <div className="mt-2">Referrals: {item.referredCount} - Qualified: {item.qualifiedCount} - Banned: {item.isBanned ? "yes" : "no"}</div>
                <div className="mt-2 text-amber-100">{item.flags.join(", ")}</div>
              </div>
            ))
          ) : (
            <div className="rounded-md border border-line bg-black/30 p-4 text-sm text-slate-400">No suspicious patterns flagged.</div>
          )}
        </div>
      </div>

      <div className="glass rounded-lg p-6">
        <h3 className="text-xl font-bold text-white">CSV Export</h3>
        <p className="mt-2 text-sm text-slate-400">Exports use the Admin API Secret header. The secret is kept only in this page state.</p>
        {exportError ? <div className="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{exportError}</div> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <ExportButton onClick={() => void downloadCsv("users")} label="Users CSV" />
          <ExportButton onClick={() => void downloadCsv("referrals")} label="Referrals CSV" />
          <ExportButton onClick={() => void downloadCsv("xp")} label="XP Ledger CSV" />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-line bg-black/30 p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-white">{typeof value === "number" ? value.toLocaleString("en-US") : value}</div>
    </div>
  );
}

function Table({ title, rows, mode }: { title: string; rows: AdminReferralSummary["topUsers"]; mode: "xp" | "referrer" }) {
  return (
    <div className="glass rounded-lg p-6">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-line">
              <th className="py-3">Wallet</th>
              <th>Code</th>
              <th>{mode === "xp" ? "XP" : "Referrals"}</th>
              <th>Qualified</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.walletAddress}`} className="border-b border-line/60 text-slate-200">
                <td className="py-3">{mode === "xp" ? compactAddress(row.walletAddress) : row.walletAddress}</td>
                <td>{row.referralCode}</td>
                <td>{mode === "xp" ? row.xpTotal.toLocaleString("en-US") : row.referralCount}</td>
                <td>{row.qualifiedReferralCount}</td>
                <td>{row.rank}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <div className="py-6 text-center text-sm text-slate-400">No data yet.</div> : null}
      </div>
    </div>
  );
}

function ExportButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-white hover:border-neon">
      {label}
    </button>
  );
}
