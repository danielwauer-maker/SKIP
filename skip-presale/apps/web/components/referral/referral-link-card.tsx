"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function ReferralLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const shareText = "Join the SKIP early community. Test the platform, earn XP and build Founder status.";

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="glass rounded-lg p-6">
      <div className="text-sm text-slate-400">Referral link</div>
      <div className="mt-3 break-all rounded-md border border-line bg-black/30 p-3 text-sm text-white">{url || "Unavailable"}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button onClick={() => void copy(url)} disabled={!url} className="flex items-center justify-center gap-2 rounded-md bg-neon px-4 py-3 font-semibold text-ink disabled:opacity-50">
          <Copy size={16} /> {copied ? "Copied" : "Copy link"}
        </button>
        <button onClick={() => void copy(`${shareText} ${url}`)} disabled={!url} className="rounded-md border border-line px-4 py-3 font-semibold text-white hover:border-neon disabled:opacity-50">
          Copy share text
        </button>
      </div>
    </div>
  );
}
