import './globals.css';
import Link from 'next/link';
import { ToastProvider, ToastViewport } from '@/components/Toast';

export const metadata = {
  title: 'Customer Portal · App Store ID Access',
  description: 'Self-service portal for viewing packages, quotas, and credential access (mock).',
};

function SiteNav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            A
          </span>
          <span className="text-sm sm:text-base">App Store ID Portal</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-900 shadow-sm hover:bg-slate-50"
          >
            Login (mock)
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <div className="min-h-screen">
            <SiteNav />
            <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
            <footer className="border-t border-slate-200 bg-white">
              <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-slate-500">
                UI skeleton with mock data only. Replace mock data with API later.
              </div>
            </footer>
            <ToastViewport />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}