import Link from 'next/link';
import { getAllApps } from '@/lib/mock-data';

export default function NotFound() {
  const apps = getAllApps();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold">App not found</h1>
        <p className="mt-2 text-sm text-slate-600">
          The link you opened does not match any available app in this mock environment.
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Back to home
          </Link>
          <Link
            href={apps[0] ? `/${apps[0].slug}` : '/'}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Open a sample app
          </Link>
        </div>

        {apps.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available slugs</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {apps.map((a) => (
                <Link
                  key={a.slug}
                  href={`/${a.slug}`}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  /{a.slug}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}