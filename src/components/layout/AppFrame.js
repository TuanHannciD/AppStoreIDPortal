"use client";

import { usePathname } from "next/navigation";

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
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-slate-500">
          © 2026 Appstoreviet. Nội dung chỉ dành cho người đã xác thực.
        </div>
      </footer>
    </div>
  );
}
