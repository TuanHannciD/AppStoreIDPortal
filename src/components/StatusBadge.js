import { cn } from '@/lib/utils';

const MAP = {
  // Subscription
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PAUSED: 'bg-amber-50 text-amber-800 border-amber-200',
  EXPIRED: 'bg-rose-50 text-rose-800 border-rose-200',

  // Credential panel
  READY: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  LOCKED: 'bg-rose-50 text-rose-800 border-rose-200',
  COOLDOWN: 'bg-amber-50 text-amber-800 border-amber-200',
};

export default function StatusBadge({ status }) {
  const key = String(status || '').toUpperCase();
  const classes = MAP[key] || 'bg-slate-50 text-slate-700 border-slate-200';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        classes
      )}
    >
      {key || 'UNKNOWN'}
    </span>
  );
}