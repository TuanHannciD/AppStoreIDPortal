"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  KeyRound,
  PlugZap,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Plus,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/admin",
    label: "T\u1ed5ng quan",
    description: "M\u00e0n h\u00ecnh ch\u00e0o m\u1eebng v\u00e0 h\u01b0\u1edbng d\u1eabn nhanh",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/apps",
    label: "Qu\u1ea3n l\u00fd app",
    description: "Qu\u1ea3n l\u00fd th\u1ef1c th\u1ec3 g\u1ed1c c\u1ee7a h\u1ec7 th\u1ed1ng",
    icon: Boxes,
  },
  {
    href: "/admin/share-pages",
    label: "Share Links",
    description: "Qu\u1ea3n l\u00fd share page v\u00e0 lu\u1ed3ng pass",
    icon: Link2,
  },
  {
    href: "/admin/share-pages/new",
    label: "T\u1ea1o Share Link",
    description: "T\u1ea1o m\u1edbi m\u1ed9t trang chia s\u1ebb",
    icon: Plus,
  },
  {
    href: "/admin/accounts",
    label: "App Accounts",
    description: "Qu\u1ea3n l\u00fd c\u00e1c t\u00e0i kho\u1ea3n th\u1eadt c\u1ee7a app",
    icon: KeyRound,
  },
  {
    href: "/admin/account-sources",
    label: "Ngu\u1ed3n API",
    description: "Qu\u1ea3n l\u00fd base URL d\u00f9ng \u0111\u1ec3 \u0111\u1ed3ng b\u1ed9 App Account",
    icon: PlugZap,
  },
]

function isItemActive(pathname, href) {
  if (!pathname) return false;
  if (pathname === href) return true;
  return href !== "/admin" && pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname, onNavigate }) {
  const active = isItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={`group block rounded-2xl border px-3 py-3 transition ${
        active
          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl ${
            active
              ? "bg-white/10 text-white"
              : "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="text-sm font-semibold">{item.label}</div>
          <div
            className={`mt-1 text-xs ${
              active ? "text-slate-200" : "text-slate-500"
            }`}
          >
            {item.description}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function AdminSidebarShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPage = useMemo(() => {
    return (
      NAV_ITEMS.find((item) => isItemActive(pathname, item.href))?.label ||
      "Admin"
    );
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function closeMobileSidebar() {
    setMobileOpen(false);
  }

  function toggleMobileSidebar() {
    setMobileOpen((prev) => !prev);
  }

  async function handleLogout() {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      setMobileOpen(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="mx-auto flex h-full max-w-[1600px]">
        <aside className="hidden w-[320px] shrink-0 border-r border-slate-200 bg-white lg:flex">
          <div className="flex w-full flex-col">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <LayoutDashboard className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Admin Console
                  </div>
                  <div className="text-xs text-slate-500">
                    Điều hướng nhanh giữa các công cụ quản trị
                  </div>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </nav>

            <div className="border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Admin
                </div>
                <div className="truncate text-sm font-semibold text-slate-900">
                  {currentPage}
                </div>
              </div>

              <button
                type="button"
                onClick={toggleMobileSidebar}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
                aria-label={mobileOpen ? "Đóng điều hướng" : "Mở điều hướng"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </header>

          {mobileOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button
                type="button"
                aria-label="Đóng lớp phủ điều hướng"
                className="absolute inset-0 bg-slate-950/40"
                onClick={closeMobileSidebar}
              />

              <aside className="absolute left-0 top-0 h-full w-[88vw] max-w-[340px] border-r border-slate-200 bg-white shadow-2xl">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        Admin Console
                      </div>
                      <div className="text-xs text-slate-500">Điều hướng</div>
                    </div>
                    <button
                      type="button"
                      onClick={closeMobileSidebar}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900"
                      aria-label="Đóng sidebar"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={closeMobileSidebar}
                      />
                    ))}
                  </nav>

                  <div className="border-t border-slate-200 p-4">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          <main className="min-h-0 min-w-0 bg-background flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
