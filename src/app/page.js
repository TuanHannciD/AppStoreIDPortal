import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import OldLinkInput from '@/components/OldLinkInput';
import { getAllApps } from '@/lib/mock-data';

export default function HomePage() {
  const apps = getAllApps();
  const sample = apps.find((a) => a.slug === 'deadcells') || apps[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Welcome"
        subtitle="This portal lets you view your rental package, remaining quota, and (mock) credential access for a specific App Store ID by app slug."
        actions={
          <div className="flex gap-2">
            <Link
              href={sample ? `/${sample.slug}` : '/'}
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to sample app
            </Link>
            <Link
              href={sample ? `/${sample.slug}#guide` : '/'}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              View guide
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
                <span className="text-lg font-semibold">LOGO</span>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Customer Self-Service Portal</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Use your app link (slug) to open a dedicated page with package status, quota usage, credentials (mock), and
                  usage instructions.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold">How to login</div>
                <p className="mt-1 text-sm text-slate-600">
                  Follow the official steps to sign in with the provided App Store ID. Video and article guides are linked
                  below.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href="#"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    Video guide (placeholder)
                  </a>
                  <a
                    href="#"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
                  >
                    Article guide (placeholder)
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold">How to get an ID</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                  <li>Open your app link (slug) from your provider.</li>
                  <li>Check quota and remaining time.</li>
                  <li>Reveal credentials only when needed.</li>
                  <li>Follow the usage guide and warnings.</li>
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold">Available sample apps (mock)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {apps.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/${a.slug}`}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    {a.name} <span className="text-slate-400">/{a.slug}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold">Use old link</h3>
            <p className="mt-1 text-sm text-slate-600">
              Paste a previous portal link or enter a slug. This is mock parsing only.
            </p>
            <div className="mt-4">
              <OldLinkInput />
            </div>

            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-sm font-semibold text-amber-900">Reminder</div>
              <p className="mt-1 text-sm text-amber-900/80">
                Do not share credentials. Reveal and copy only when you are ready to sign in.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}