import Link from "next/link";

export default async function AdminLoginPage({ searchParams }: { searchParams?: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const hasError = params?.error === "invalid";

  return (
    <main className="mx-auto max-w-md px-4 py-20">
      <div className="rounded-lg border border-line bg-black/30 p-8">
        <div className="text-sm uppercase tracking-[0.2em] text-neon">Admin</div>
        <h1 className="mt-2 text-3xl font-black text-white">Founder Control Center</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">Enter the server-side admin password to start an 8 hour HttpOnly session.</p>
        {hasError ? <div className="mt-4 rounded border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">Invalid admin password.</div> : null}
        <form action="/api/admin/login" method="post" className="mt-6 grid gap-4">
          <label className="text-sm font-semibold text-slate-300" htmlFor="password">Admin password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="rounded-md border border-line bg-black/40 px-4 py-3 text-white"
            required
          />
          <button className="rounded-md bg-neon px-4 py-3 font-semibold text-ink" type="submit">Login</button>
        </form>
        <Link href="/" className="mt-5 inline-block text-sm text-slate-400 hover:text-neon">Back to site</Link>
      </div>
    </main>
  );
}
