"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-5 inline-flex rounded-full border border-line bg-neon/10 px-4 py-2 text-sm text-neon">
            Transparency-focused crypto project with planned app utility
          </div>
          <h1 className="neon-text max-w-4xl text-5xl font-black tracking-normal text-white sm:text-6xl lg:text-7xl">
            $SKIP — Stop wasting time.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            The community token for people who are done wasting life in queues, traffic, waiting rooms and broken
            systems.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/presale"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-neon px-6 py-3 font-semibold text-ink transition hover:bg-acid"
            >
              Join Presale <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-3 font-semibold text-white transition hover:border-neon"
            >
              <LayoutDashboard size={18} /> Open Dashboard
            </Link>
            <Link
              href="/whitepaper"
              className="focus-ring inline-flex items-center justify-center gap-2 rounded-md border border-line px-6 py-3 font-semibold text-white transition hover:border-neon"
            >
              <BookOpen size={18} /> Read Whitepaper
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="glass relative min-h-[360px] overflow-hidden rounded-lg p-8"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon to-transparent" />
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.25em] text-neon">Presale MVP</div>
              <div className="mt-8 text-8xl font-black text-white">$</div>
              <div className="-mt-4 text-7xl font-black text-neon">SKIP</div>
            </div>
            <div className="grid gap-3 text-sm text-slate-300">
              <p>Built with transparency-first architecture.</p>
              <p>Security-focused Web3 infrastructure.</p>
              <p>Structured for long-term trust and transparency.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
