import { compactAddress } from "../../lib/format";

export function ReferralCodeCard({ code, walletAddress }: { code: string; walletAddress: string }) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="text-sm text-slate-400">Registered wallet</div>
      <div className="mt-1 font-semibold text-white">{compactAddress(walletAddress)}</div>
      <div className="mt-6 text-sm text-slate-400">Referral code</div>
      <div className="mt-2 rounded-md border border-neon/30 bg-neon/10 p-4 text-2xl font-black text-neon">{code}</div>
    </div>
  );
}
