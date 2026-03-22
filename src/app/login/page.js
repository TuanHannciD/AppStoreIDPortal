"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export default function LoginPage() {
  const { pushToast } = useToast();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        pushToast({
          title: "Đăng nhập thất bại",
          message: data?.message || "Email hoặc mật khẩu không đúng.",
          intent: "danger",
        });
        setLoading(false);
        return;
      }

      pushToast({
        title: "Đăng nhập thành công",
        message: "Đang chuyển về trang chủ...",
        intent: "success",
      });
      router.push("/admin");
    } catch {
      pushToast({
        title: "Đăng nhập thất bại",
        message: "Lỗi mạng. Vui lòng thử lại.",
        intent: "danger",
      });
      setLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-card">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500 sm:h-40" />

      <div className="relative grid min-h-[calc(100vh-11rem)] grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:p-8">
        <section className="flex flex-col justify-between rounded-[1.5rem] bg-slate-900 p-6 text-white sm:p-8">
          <div className="space-y-5">
            <div className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
              Cổng Quản Trị
            </div>

            <div className="space-y-3">
              <h1 className="max-w-md text-3xl font-semibold tracking-tight sm:text-4xl">
                Đăng nhập quản trị viên cho hệ thống App Store ID.
              </h1>
              <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Màn hình này chỉ phục vụ tài khoản quản trị. Các luồng tạo tài
                khoản và quên mật khẩu đã được lược bỏ để trải nghiệm đăng nhập
                gọn gàng, rõ ràng và phù hợp với vận hành nội bộ.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">
                  Chỉ dành cho quản trị viên
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Chỉ chấp nhận tài khoản có quyền{" "}
                  <span className="font-medium text-white">ADMIN</span> hoặc{" "}
                  <span className="font-medium text-white">SUPER_ADMIN</span> để
                  truy cập khu vực quản trị.
                </p>
              </div>

              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold">
                  Trải nghiệm tinh gọn
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Giao diện được tối giản để tập trung vào đăng nhập, hiển thị
                  tốt trên desktop, mobile và các kích thước màn hình khác nhau.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              Về trang chủ
            </Link>

            <div className="inline-flex items-center rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200">
              Không có đăng ký hoặc quên tài khoản
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                Đăng nhập
              </h2>
              <p className="text-sm leading-6 text-slate-600">
                Dùng tài khoản admin đã có sẵn trong database để truy cập khu
                vực quản trị.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm shadow-sm transition placeholder:text-slate-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập vào cổng quản trị"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
