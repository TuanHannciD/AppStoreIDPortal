'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseSlugFromInput } from '@/lib/utils';
import { useToast } from '@/components/Toast';

export default function OldLinkInput() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [value, setValue] = useState('');

  function onSubmit(e) {
    e.preventDefault();
    const slug = parseSlugFromInput(value);
    if (!slug) {
      pushToast({
        title: 'Invalid link/slug',
        message: 'Paste a URL like https://example.com/deadcells or type a slug like deadcells.',
        intent: 'warning',
      });
      return;
    }
    router.push(`/${slug}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste old link or enter slug (e.g. deadcells)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
          aria-label="Old link or slug"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Open
        </button>
      </div>
      <p className="text-xs text-slate-500">
        Parsing logic extracts the last path segment and keeps only letters/numbers/hyphen/underscore.
      </p>
    </form>
  );
}