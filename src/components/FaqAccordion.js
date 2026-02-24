'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function FaqAccordion({ items = [] }) {
  const [openId, setOpenId] = useState(items[0]?.id || null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">FAQ</h2>
        <span className="text-xs text-slate-500">{items.length} items</span>
      </div>

      <div className="mt-4 divide-y divide-slate-200">
        {items.map((it) => {
          const isOpen = openId === it.id;
          const panelId = `faq-panel-${it.id}`;
          return (
            <div key={it.id} className="py-3">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenId((prev) => (prev === it.id ? null : it.id))}
              >
                <span className="text-sm font-medium text-slate-900">{it.q}</span>
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-lg border text-sm',
                    isOpen ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white'
                  )}
                  aria-hidden="true"
                >
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              <div
                id={panelId}
                className={cn('mt-2 text-sm text-slate-600', isOpen ? 'block' : 'hidden')}
              >
                {it.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}