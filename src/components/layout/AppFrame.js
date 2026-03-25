"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
            Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function AppFrame({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isHomeRoute = pathname === "/";

  if (isAdminRoute) {
    return <div className="h-screen overflow-hidden">{children}</div>;
  }

  if (isHomeRoute) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-slate-500">
          UI skeleton with mock data only. Replace mock data with API later.
        </div>
      </footer>
    </div>
  );
}
