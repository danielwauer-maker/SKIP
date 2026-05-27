"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Compass,
  Eye,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Users,
  X,
  Zap
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type WaitlistState = "idle" | "loading" | "success" | "error";
type CommunityCard = [title: string, text: string, Icon: LucideIcon];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fadeIn = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 }
};

const problemCards = ["Queues", "Traffic", "Crowded places", "Appointments", "Inefficient systems", "Poor timing decisions"];

const communityCards: CommunityCard[] = [
  ["Shape the vision", "Help define what real-world activity intelligence should become.", Compass],
  ["Follow development", "Track roadmap updates, UI previews, experiments, and decisions as they happen.", Eye],
  ["Give feedback", "Share practical problems from queues, traffic, appointments, and timing decisions.", MessageCircle],
  ["Join early discussions", "Meet other early supporters before the ecosystem expands.", Users],
  ["Help build the movement", "Support a community that values time, transparency, and practical utility.", Sparkles]
];

const publicUpdates = [
  "Development updates",
  "UI previews",
  "Roadmap changes",
  "Security decisions",
  "Community feedback"
];

const securityItems = [
  "We will never ask for seed phrases.",
  "We will never DM first with investment offers.",
  "Official links are only shared through the website, Discord, and X.",
  "No guaranteed profit claims.",
  "Smart contracts must be reviewed before mainnet use."
];

const faqs = [
  [
    "What is SKIP?",
    "SKIP is an early-stage community-driven project focused on reducing wasted time in real-world situations through shared activity intelligence and future ecosystem tools."
  ],
  [
    "Is SKIP only a meme coin?",
    "No. SKIP may use community and token mechanics, but the long-term vision is utility, transparency, and real-world relevance."
  ],
  [
    "Is there a presale?",
    "A presale may be part of the future roadmap, but the current focus is community, product foundation, security, and transparency."
  ],
  [
    "Why join the waitlist?",
    "Early supporters can follow development, give feedback, help shape the project, and become part of the first SKIP community."
  ],
  ["Is this financial advice?", "No. Nothing on this website is financial advice."]
];

export function LandingPage() {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "#waitlist";
  const xUrl = process.env.NEXT_PUBLIC_X_URL || "#waitlist";
  const [email, setEmail] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [discordUsername, setDiscordUsername] = useState("");
  const [status, setStatus] = useState<WaitlistState>("idle");
  const [message, setMessage] = useState("");

  const heroSignals = useMemo(
    () => [
      ["Community", "Early supporters shaping the signal network"],
      ["Utility", "Real-world activity intelligence foundation"],
      ["Trust", "Security decisions shared before launch"]
    ],
    []
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !emailPattern.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Enter a valid email address to join early access.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          xHandle: xHandle.trim(),
          discordUsername: discordUsername.trim()
        })
      });

      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message || "Unable to join the waitlist right now.");

      setStatus("success");
      setMessage("You're on the SKIP waitlist. Welcome to the early community.");
      setEmail("");
      setXHandle("");
      setDiscordUsername("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to join the waitlist right now.");
    }
  }

  return (
    <main className="overflow-hidden">
      <section className="relative px-4 py-16 sm:py-24 lg:py-28">
        <OrangeAtmosphere />
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <div className="mb-5 inline-flex rounded-full border border-neon/35 bg-neon/10 px-4 py-2 text-sm font-semibold text-acid shadow-glow">
              Building publicly. Community-first. Security-focused.
            </div>
            <h1 className="neon-text max-w-4xl text-5xl font-black tracking-normal text-white sm:text-6xl lg:text-7xl">
              Stop wasting your life <span className="orange-gradient-text">waiting.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300">
              SKIP is building a community-driven real-world activity intelligence ecosystem designed to help people
              make smarter decisions in everyday life.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                href={discordUrl}
                className="focus-ring glow-pulse inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-acid via-neon to-[#e83a00] px-6 py-3 font-semibold text-ink transition hover:scale-[1.02]"
              >
                <MessageCircle size={18} /> Join Discord
              </a>
              <a
                href={xUrl}
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-neon/45 bg-white/[0.03] px-6 py-3 font-semibold text-white transition hover:border-acid hover:bg-neon/10"
              >
                <X size={18} /> Follow on X
              </a>
              <a
                href="#waitlist"
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-neon/45 bg-white/[0.03] px-6 py-3 font-semibold text-white transition hover:border-acid hover:bg-neon/10"
              >
                Join Waitlist <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 rounded-full bg-neon/25 blur-3xl" />
            <div className="glass relative overflow-hidden rounded-lg p-5 sm:p-7">
              <div className="motion-streak absolute left-[-15%] top-10 h-px w-[72%] bg-gradient-to-r from-transparent via-acid to-transparent" />
              <div className="motion-streak absolute left-[-8%] top-24 h-px w-[52%] bg-gradient-to-r from-transparent via-neon to-transparent" />
              <div className="relative mx-auto aspect-square max-w-[430px]">
                <Image
                  src="/skip-icon.png"
                  alt="SKIP orange speed logo"
                  fill
                  sizes="(max-width: 768px) 82vw, 430px"
                  className="rounded-full object-contain drop-shadow-[0_0_42px_rgba(255,106,0,0.35)]"
                  priority
                />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {heroSignals.map(([label, text]) => (
                  <div key={label} className="rounded-lg border border-neon/20 bg-black/35 p-4">
                    <p className="text-sm font-semibold text-acid">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-neutral-300">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Section id="problem" eyebrow="The Problem" title="Time disappears in places people cannot see clearly.">
        <div className="grid gap-6 md:grid-cols-[0.82fr_1.18fr]">
          <motion.p {...fadeIn} className="text-lg leading-8 text-neutral-300">
            Every day, people lose time because they lack real-world visibility. SKIP starts with a simple belief: time
            should not be wasted blindly.
          </motion.p>
          <motion.div {...fadeIn} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {problemCards.map((item) => (
              <div key={item} className="glass group rounded-lg p-4 text-sm font-semibold text-white transition hover:-translate-y-1 hover:border-acid/70 hover:shadow-glow">
                <Zap className="mb-4 text-neon transition group-hover:text-acid" size={18} aria-hidden="true" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      <Section id="vision" eyebrow="Vision" title="From wasted time to smarter movement.">
        <motion.div {...fadeIn} className="glass rounded-lg p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="flex items-start gap-4">
              <div className="rounded-md border border-neon/35 bg-neon/10 p-3 text-acid shadow-glow">
                <TimerReset aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Community and utility before hype.</h3>
                <p className="mt-3 leading-7 text-neutral-300">
                  SKIP is a long-term ecosystem concept for shared activity signals, real-world intelligence, smarter
                  decisions, and a potential future utility layer.
                </p>
              </div>
            </div>
            <p className="leading-8 text-neutral-300">
              The project starts with community and transparency before token promotion. The early goal is to gather
              people who care about wasted time, practical coordination, and building public trust before any larger
              launch moment.
            </p>
          </div>
        </motion.div>
      </Section>

      <Section id="community" eyebrow="Community" title="Join early for the part that matters most: direction.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {communityCards.map(([title, text, Icon]) => (
            <motion.div key={title} {...fadeIn} className="glass group rounded-lg p-5 transition hover:-translate-y-1 hover:border-acid/70 hover:shadow-glow">
              <Icon className="text-neon transition group-hover:text-acid" aria-hidden="true" />
              <h3 className="mt-5 text-lg font-bold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-neutral-300">{text}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-8">
          <a
            href={discordUrl}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-acid via-neon to-[#e83a00] px-6 py-3 font-semibold text-ink transition hover:scale-[1.02]"
          >
            Join the SKIP Community <ArrowRight size={18} />
          </a>
        </div>
      </Section>

      <Section id="building-public" eyebrow="Building In Public" title="Transparent work before loud promises.">
        <motion.div {...fadeIn} className="glass rounded-lg p-6 sm:p-8">
          <div className="relative grid gap-5 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-gradient-to-b before:from-acid before:via-neon before:to-transparent">
            {publicUpdates.map((item) => (
              <div key={item} className="relative flex items-center gap-4 pl-10">
                <span className="absolute left-0 h-7 w-7 rounded-full border border-acid bg-ink shadow-[0_0_24px_rgba(255,106,0,0.45)]" />
                <span className="font-semibold text-white">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      <Section id="waitlist" eyebrow="Waitlist" title="Join early access without connecting a wallet.">
        <motion.form
          {...fadeIn}
          onSubmit={handleSubmit}
          className="glass mx-auto grid max-w-3xl gap-5 rounded-lg p-6 sm:p-8"
          noValidate
        >
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-white">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="focus-ring mt-2 w-full rounded-md border border-neon/25 bg-black/45 px-4 py-3 text-white placeholder:text-neutral-600"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="xHandle" className="text-sm font-semibold text-white">
                X/Twitter handle <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                id="xHandle"
                name="xHandle"
                type="text"
                value={xHandle}
                onChange={(event) => setXHandle(event.target.value)}
                className="focus-ring mt-2 w-full rounded-md border border-neon/25 bg-black/45 px-4 py-3 text-white placeholder:text-neutral-600"
                placeholder="@skip"
              />
            </div>
            <div>
              <label htmlFor="discordUsername" className="text-sm font-semibold text-white">
                Discord username <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                id="discordUsername"
                name="discordUsername"
                type="text"
                value={discordUsername}
                onChange={(event) => setDiscordUsername(event.target.value)}
                className="focus-ring mt-2 w-full rounded-md border border-neon/25 bg-black/45 px-4 py-3 text-white placeholder:text-neutral-600"
                placeholder="skipbuilder"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="focus-ring glow-pulse inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-acid via-neon to-[#e83a00] px-6 py-3 font-semibold text-ink transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Joining..." : "Join Early Access"}
          </button>
          {message ? (
            <p
              className={`rounded-md border px-4 py-3 text-sm ${
                status === "success"
                  ? "border-acid/45 bg-neon/10 text-acid"
                  : "border-red-400/40 bg-red-500/10 text-red-200"
              }`}
              role={status === "error" ? "alert" : "status"}
            >
              {message}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-neutral-500">
            No wallet connection. No seed phrase. No private keys. No token purchase flow.
          </p>
        </motion.form>
      </Section>

      <Section id="security" eyebrow="Security" title="Security first. No shortcuts.">
        <motion.div {...fadeIn} className="glass rounded-lg p-6 sm:p-8">
          <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <ShieldCheck className="text-acid drop-shadow-[0_0_24px_rgba(255,106,0,0.45)]" size={40} aria-hidden="true" />
              <p className="mt-5 text-lg leading-8 text-neutral-300">
                Trust is part of the product. SKIP will prioritize careful communication, official channels, and review
                before any mainnet use.
              </p>
            </div>
            <div className="grid gap-3">
              {securityItems.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-neon/20 bg-black/35 p-4">
                  <LockKeyhole className="mt-0.5 shrink-0 text-acid" size={18} aria-hidden="true" />
                  <p className="text-sm leading-6 text-neutral-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      <Section id="faq" eyebrow="FAQ" title="Straight answers for early supporters.">
        <div className="grid gap-4">
          {faqs.map(([question, answer]) => (
            <motion.details key={question} {...fadeIn} className="glass rounded-lg p-5 transition hover:border-acid/60">
              <summary className="cursor-pointer text-lg font-bold text-white">{question}</summary>
              <p className="mt-3 leading-7 text-neutral-300">{answer}</p>
            </motion.details>
          ))}
        </div>
      </Section>

      <section className="px-4 pb-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-lg border border-neon/25 bg-black/35 p-5 text-sm text-neutral-400 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-neutral-300">
            <Clock3 className="text-acid" aria-hidden="true" />
            <span>SKIP is early. The public record starts with community, product thinking, and security.</span>
          </div>
          <Link href="/disclaimer" className="font-semibold text-acid hover:text-neon">
            Read disclaimer
          </Link>
        </div>
      </section>
    </main>
  );
}

function OrangeAtmosphere() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute left-[8%] top-8 h-80 w-80 rounded-full bg-neon/20 blur-3xl" />
      <div className="absolute right-[10%] top-32 h-96 w-96 rounded-full bg-[#e83a00]/18 blur-3xl" />
      <div className="motion-streak absolute left-[-10%] top-24 h-px w-[60%] bg-gradient-to-r from-transparent via-neon to-transparent" />
      <div className="motion-streak absolute right-[-12%] top-52 h-px w-[50%] bg-gradient-to-r from-transparent via-acid to-transparent" />
      <div className="absolute bottom-0 left-1/2 h-px w-[80%] -translate-x-1/2 bg-gradient-to-r from-transparent via-neon/45 to-transparent" />
    </div>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children
}: Readonly<{ id?: string; eyebrow: string; title: string; children: React.ReactNode }>) {
  return (
    <section id={id} className="px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <motion.div {...fadeIn} className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-acid">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">{title}</h2>
        </motion.div>
        {children}
      </div>
    </section>
  );
}
