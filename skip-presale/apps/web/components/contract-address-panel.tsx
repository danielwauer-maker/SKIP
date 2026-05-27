"use client";

import { Copy, ExternalLink } from "lucide-react";
import { contracts, hasConfiguredContracts } from "../config/contracts";
import { targetChain } from "../config/chains";
import { compactAddress } from "../lib/format";

const contractRows = [
  ["SKIP Token", contracts.skipToken],
  ["Presale", contracts.skipPresale],
  ["Team Vesting", contracts.skipTeamVesting],
  ["USDC", contracts.usdc]
] as const;

export function ContractAddressPanel() {
  const explorerUrl = "blockExplorers" in targetChain ? targetChain.blockExplorers?.default.url : undefined;

  async function copy(value: string) {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(value);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-6 max-w-3xl">
        <h2 className="text-3xl font-black text-white">Contract Addresses</h2>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Always verify the connected network and contract addresses before approving or signing transactions. These
          values come from the current frontend environment.
        </p>
      </div>

      {!hasConfiguredContracts() ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
          Contract addresses are not fully configured for this environment.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        {contractRows.map(([label, address]) => (
          <div key={label} className="rounded-lg border border-line bg-black/30 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</div>
                <div className="mt-2 break-all font-semibold text-white">{address}</div>
                <div className="mt-1 text-xs text-slate-500">{compactAddress(address)}</div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void copy(address)}
                  aria-label={`Copy ${label} address`}
                  title={`Copy ${label} address`}
                  className="rounded-md border border-line p-2 text-slate-200 hover:border-neon hover:text-neon"
                >
                  <Copy size={16} />
                </button>
                {explorerUrl ? (
                  <a
                    href={`${explorerUrl}/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${label} in explorer`}
                    title={`Open ${label} in explorer`}
                    className="rounded-md border border-line p-2 text-slate-200 hover:border-neon hover:text-neon"
                  >
                    <ExternalLink size={16} />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
