"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";

function getCurrentPageLabel(pathname) {
  if (pathname === "/admin") return "Tổng quan";
  if (pathname?.startsWith("/admin/share-pages/new")) return "Tạo share link";
  if (pathname?.startsWith("/admin/share-pages")) return "Share links";
  return "Admin";
}

export default function AdminSidebarShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  const currentPage = useMemo(() => getCurrentPageLabel(pathname), [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="mx-auto flex h-full max-w-[1600px] flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Admin
                </div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {currentPage}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-background px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
