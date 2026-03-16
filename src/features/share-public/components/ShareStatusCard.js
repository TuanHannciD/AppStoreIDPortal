"use client";

/**
 * Card hiển thị trạng thái chung của share link:
 * - not found
 * - expired
 * - error
 */
export default function ShareStatusCard({
  title,
  message,
  status = "default",
}) {
  const colorClass =
    status === "error"
      ? "border-red-900/60 bg-red-950/20 text-red-200"
      : "border-neutral-800";

  return (
    <div className={`rounded-2xl border p-5 space-y-2 ${colorClass}`}>
      <div className="text-base font-semibold">{title}</div>
      <div className="text-sm text-neutral-300">{message}</div>
    </div>
  );
}
