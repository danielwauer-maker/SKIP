const faqs = [
  ["What is $SKIP?", "$SKIP is an experimental community token focused on the shared frustration of wasted time."],
  ["Is this an investment?", "No. $SKIP should be treated as a high-risk experimental crypto asset, not an investment product."],
  ["Is profit guaranteed?", "No. There are no profit, return, listing, liquidity, market price or future utility guarantees."],
  [
    "When can I claim?",
    "Claims are enabled only after successful finalize and softcap achievement. 50% unlocks immediately, then 50% vests linearly over 90 days."
  ],
  ["What happens if softcap is not reached?", "Refunds can be enabled after finalize once the contract holds enough USDC to repay all contributions."],
  [
    "Why can 25% be used during presale?",
    "A transparent development unlock can fund infrastructure, design, legal review and community growth, but only from fully completed stages."
  ],
  ["What is the planned app utility?", "The intended direction is a future wait-time ecosystem with crowd reports, check-ins and busy/quiet indicators."],
  ["Which chain is used?", "Polygon Amoy is used first for testnet deployment. Polygon mainnet can be considered after review."],
  ["Which payment token is used?", "USDC is the payment token. Local tests use MockUSDC with 6 decimals."]
];

export function FaqSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <h2 className="text-4xl font-black text-white">FAQ</h2>
      <div className="mt-8 grid gap-4">
        {faqs.map(([question, answer]) => (
          <details key={question} className="rounded-lg border border-line bg-black/30 p-5">
            <summary className="cursor-pointer font-semibold text-white">{question}</summary>
            <p className="mt-3 leading-7 text-slate-300">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
