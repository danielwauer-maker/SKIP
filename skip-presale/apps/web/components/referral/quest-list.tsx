import type { QuestView } from "../../types/referral";

const actionLabels: Record<string, string> = {
  CONNECT_WALLET_DAILY: "Check in",
  COMPLETE_TESTNET_BUY: "Verify buy",
  FEEDBACK_SUBMITTED: "Submit feedback",
  INVITE_1_FRIEND: "Check invite",
  INVITE_5_FRIENDS: "Check invites"
};

export function QuestList({ quests, loading, onComplete }: { quests: QuestView[]; loading: boolean; onComplete: (actionType: string, proof?: string) => void }) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Quests</h2>
          <p className="mt-1 text-sm text-slate-400">Complete testnet and community actions to build XP.</p>
        </div>
      </div>
      <div className="grid gap-3">
        {quests.length === 0 ? <div className="rounded-md border border-line bg-black/30 p-4 text-sm text-slate-400">Register to load quests.</div> : null}
        {quests.map((quest) => (
          <div key={quest.key} className="grid gap-4 rounded-md border border-line bg-black/30 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-white">{quest.title}</h3>
                <span className="rounded border border-neon/30 bg-neon/10 px-2 py-1 text-xs font-semibold text-neon">+{quest.points} XP</span>
                <span className="rounded border border-line px-2 py-1 text-xs text-slate-300">{quest.status}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{quest.description}</p>
              {quest.manualLabel ? <p className="mt-2 text-xs text-amber-100">{quest.manualLabel}</p> : null}
            </div>
            {quest.automatic && quest.status !== "APPROVED" ? (
              <button onClick={() => onComplete(quest.key)} disabled={loading} className="rounded-md bg-neon px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50">
                {loading ? "Checking..." : actionLabels[quest.key] || "Complete"}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
