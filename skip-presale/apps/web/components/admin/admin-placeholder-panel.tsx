export function AdminPlaceholderPanel({ title, metrics, todos }: { title: string; metrics: string[]; todos: string[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[0.8fr_1fr]">
      <div className="rounded-lg border border-line bg-black/30 p-5">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="mt-3 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs text-amber-100">
          Not active yet
        </div>
        <div className="mt-5 grid gap-2 text-sm text-slate-300">
          {metrics.map((metric) => (
            <div key={metric} className="rounded border border-line bg-black/20 p-3">
              {metric}: <span className="text-slate-500">pending integration</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-line bg-black/30 p-5">
        <h3 className="font-semibold text-white">Technical TODO</h3>
        <ul className="mt-4 grid gap-2 text-sm text-slate-300">
          {todos.map((todo) => (
            <li key={todo} className="rounded border border-line bg-black/20 p-3">
              {todo}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
