'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { useToast } from '@/components/Toast';
import { getAllApps } from '@/lib/mock-data';

export default function LoginPage() {
  const { pushToast } = useToast();
  const apps = useMemo(() => getAllApps(), []);
  const sample = apps.find((a) => a.slug === 'deadcells') || apps[0];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    // Mock auth only.
    setTimeout(() => {
      setLoading(false);
      pushToast({
        title: 'Mock login successful',
        message: 'Auth is not implemented yet. Redirecting to sample app…',
        intent: 'success',
      });
      if (sample) window.location.href = `/${sample.slug}`;
    }, 500);
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Login (mock)"
        subtitle="This screen is UI-only. Replace with real authentication later."
        actions={
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Back
          </Link>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Login'}
          </button>

          <p className="text-xs text-slate-500">
            Note: this project has no backend/auth yet. This form only demonstrates UI flow.
          </p>
        </form>
      </div>
    </div>
  );
}