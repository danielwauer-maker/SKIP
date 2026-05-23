"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { WalletConnectButton } from "../wallet-connect-button";
import { ReferralCodeCard } from "./referral-code-card";
import { ReferralLinkCard } from "./referral-link-card";
import { XpProgressCard } from "./xp-progress-card";
import { OgRankCard } from "./og-rank-card";
import { QuestList } from "./quest-list";
import { ReferralLeaderboard } from "./leaderboard";
import { ReferralStatsCard } from "./referral-stats";
import type { QuestView, ReferralStats } from "../../types/referral";

type ReferralState = {
  user: {
    walletAddress: string;
    referralCode: string;
    xpTotal: number;
    rank: string;
    isOgFounder: boolean;
  } | null;
  stats?: ReferralStats;
  quests?: QuestView[];
  referralUrl?: string;
  rank?: {
    current: { name: string; minXp: number; badgeClass: string };
    next: { name: string; minXp: number; badgeClass: string } | null;
    xpToNext: number;
    progress: number;
  };
};

export function ReferralDashboard() {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<ReferralState>({ user: null });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const referralCodeFromUrl = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return new URLSearchParams(window.location.search).get("ref") || undefined;
  }, []);

  async function loadMe() {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/referral/me?walletAddress=${address}`);
      const json = (await response.json()) as ReferralState & { error?: string };
      if (!response.ok) throw new Error(json.error || "Could not load referral profile.");
      setState(json);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load referral profile.");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!address) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/referral/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          referralCodeFromUrl,
          referralClickId: referralCodeFromUrl ? sessionStorage.getItem(`skip-ref-click:${referralCodeFromUrl}`) : undefined
        })
      });
      const json = (await response.json()) as ReferralState & { error?: string; created?: boolean };
      if (!response.ok) throw new Error(json.error || "Registration failed.");
      setState(json);
      setMessage(json.created ? "Wallet registered. XP profile created." : "Profile loaded.");
    } catch (registerError) {
      setError(registerError instanceof Error ? registerError.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  async function completeAction(actionType: string, proof?: string) {
    if (!address) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/referral/complete-action", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ walletAddress: address, actionType, proof })
      });
      const json = (await response.json()) as { error?: string; awarded?: boolean; points?: number; pending?: boolean; message?: string };
      if (!response.ok) throw new Error(json.error || "Action could not be completed.");
      setMessage(json.pending ? json.message || "Manual verification queued." : json.awarded ? `XP awarded: ${json.points}` : "Already completed for this period.");
      await loadMe();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Action could not be completed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (referralCodeFromUrl) {
      void fetch("/api/referral/track-click", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ referralCode: referralCodeFromUrl })
      })
        .then((response) => response.json())
        .then((json: { clickId?: string }) => {
          if (json.clickId) sessionStorage.setItem(`skip-ref-click:${referralCodeFromUrl}`, json.clickId);
        })
        .catch(() => undefined);
    }
  }, [referralCodeFromUrl]);

  useEffect(() => {
    void loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-neon">Founder Reputation</div>
          <h1 className="mt-2 text-4xl font-black text-white">Referral + XP Hub</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Join the SKIP early community. Test the platform, earn XP and build Founder status.
          </p>
        </div>
        <WalletConnectButton />
      </div>

      <div className="mb-6 rounded-md border border-line bg-black/30 p-4 text-sm leading-6 text-slate-300">
        XP and Founder status are community reputation signals. They do not guarantee token rewards, profits or allocations.
      </div>

      {!isConnected ? (
        <div className="glass rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Connect wallet to start</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">Your public wallet address is used to create your XP profile and referral code.</p>
          <div className="mt-6 flex justify-center">
            <WalletConnectButton />
          </div>
        </div>
      ) : !state.user ? (
        <div className="glass rounded-lg p-8">
          {referralCodeFromUrl ? <div className="mb-4 rounded-md border border-neon/30 bg-neon/10 p-3 text-sm text-neon">Referral detected: {referralCodeFromUrl}</div> : null}
          <h2 className="text-2xl font-bold text-white">Register your wallet</h2>
          <p className="mt-3 text-slate-400">Create your referral code, claim starter XP and unlock community quests.</p>
          <button onClick={() => void register()} disabled={loading} className="mt-6 rounded-md bg-neon px-5 py-3 font-semibold text-ink disabled:opacity-50">
            {loading ? "Registering..." : "Register wallet"}
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {message ? <Status tone="success" text={message} /> : null}
          {error ? <Status tone="error" text={error} /> : null}
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-6">
              <ReferralCodeCard code={state.user.referralCode} walletAddress={state.user.walletAddress} />
              <ReferralLinkCard url={state.referralUrl || ""} />
              <ReferralStatsCard stats={state.stats} />
            </div>
            <div className="grid gap-6">
              <XpProgressCard xpTotal={state.user.xpTotal} rank={state.rank} />
              <OgRankCard rank={state.user.rank} isOgFounder={state.user.isOgFounder} />
            </div>
          </div>
          <QuestList quests={state.quests || []} loading={loading} onComplete={(actionType, proof) => void completeAction(actionType, proof)} />
          <ReferralLeaderboard />
        </div>
      )}
    </section>
  );
}

function Status({ tone, text }: { tone: "success" | "error"; text: string }) {
  const classes = tone === "success" ? "border-neon/30 bg-neon/10 text-neon" : "border-red-400/30 bg-red-400/10 text-red-100";
  return <div className={`rounded-md border p-3 text-sm ${classes}`}>{text}</div>;
}
