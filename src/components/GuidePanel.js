export default function GuidePanel({ title = 'Guide', steps = [], notes = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-base font-semibold">{title}</h2>

      <ol className="mt-4 space-y-2 text-sm text-slate-700">
        {steps.map((s, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {idx + 1}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ol>

      {notes.length > 0 ? (
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {notes.map((n, idx) => (
              <li key={idx}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}