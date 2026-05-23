import { AdminDashboard } from "../../components/admin/admin-dashboard";

export default function AdminPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_ADMIN !== "true") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-lg border border-line bg-black/30 p-8">
          <h1 className="text-3xl font-black text-white">Admin disabled</h1>
          <p className="mt-4 leading-7 text-slate-300">
            Set <code>NEXT_PUBLIC_ENABLE_ADMIN=true</code> locally to enable the Founder Control Center.
          </p>
          <p className="mt-4 rounded border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            Frontend guard only. Real auth required before public deployment.
          </p>
        </div>
      </main>
    );
  }

  return <AdminDashboard />;
}
