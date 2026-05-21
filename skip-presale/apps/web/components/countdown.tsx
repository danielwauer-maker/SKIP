"use client";

import { useEffect, useMemo, useState } from "react";

function formatPart(value: number) {
  return value.toString().padStart(2, "0");
}

export function Countdown({ endTime }: { endTime?: bigint }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = useMemo(() => {
    const remaining = Math.max(0, Number(endTime || BigInt(0)) - now);
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const seconds = remaining % 60;
    return { days, hours, minutes, seconds };
  }, [endTime, now]);

  return (
    <div className="grid grid-cols-4 gap-2 text-center">
      {[
        ["D", parts.days],
        ["H", parts.hours],
        ["M", parts.minutes],
        ["S", parts.seconds]
      ].map(([label, value]) => (
        <div key={label} className="rounded border border-line bg-black/30 p-3">
          <div className="text-xl font-semibold text-white">{formatPart(Number(value))}</div>
          <div className="text-xs text-slate-400">{label}</div>
        </div>
      ))}
    </div>
  );
}
