"use client";

import { useEffect, useState } from "react";
import { compactAddress } from "../../lib/format";

type Leader = {
  position: number;
  walletAddress: string;
  xpTotal: number;
  rank: string;
  referralCount: number;
  qualifiedReferralCount: number;
  isOgFounder: boolean;
};

export function ReferralLeaderboard() {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/referral/leaderboard")
      .then((response) => response.json())
      .then((json: { users?: Leader[]; error?: string }) => {
        if (json.error) throw new Error(json.error);
        setLeaders(json.users || []);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Could not load leaderboard."));
  }, []);

  return (
    <div className="glass rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
      <p className="mt-1 text-sm text-slate-400">Top 100 by XP. Public wallet addresses are shortened.</p>
      {error ? <div className="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{error}</div> : null}
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="text-slate-400">
            <tr className="border-b border-line">
              <th className="py-3">#</th>
              <th>Wallet</th>
              <th>Rank</th>
              <th>XP</th>
              <th>Referrals</th>
              <th>Qualified</th>
              <th>OG</th>
            </tr>
          </thead>
          <tbody>
            {leaders.map((leader) => (
              <tr key={leader.walletAddress} className="border-b border-line/60 text-slate-200">
                <td className="py-3">{leader.position}</td>
                <td>{compactAddress(leader.walletAddress)}</td>
                <td>{leader.rank}</td>
                <td>{leader.xpTotal.toLocaleString("en-US")}</td>
                <td>{leader.referralCount}</td>
                <td>{leader.qualifiedReferralCount}</td>
                <td>{leader.isOgFounder ? "OG" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {leaders.length === 0 ? <div className="py-8 text-center text-sm text-slate-400">No XP profiles yet.</div> : null}
      </div>
    </div>
  );
}
