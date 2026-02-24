export default function SpecialAlert({ packageType, message }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm font-semibold text-amber-900">Special package warning</div>
        <div className="font-mono text-xs text-amber-900/80">{packageType}</div>
      </div>
      <p className="mt-2 text-sm text-amber-900/80">{message}</p>
    </div>
  );
}