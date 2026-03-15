"use client";

import { useState } from "react";

/**
 * Card nhập pass để verify.
 *
 * Flow:
 * - User nhập pass
 * - Submit -> gọi verify API
 * - Chưa reveal full account info ở bước này
 */
export default function SharePassVerifyCard({
  onVerify,
  verifying,
  verifyError,
}) {
  const [pass, setPass] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await onVerify?.(pass);
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-5 space-y-4">
      <div>
        <div className="text-base font-semibold">Verify access pass</div>
        <div className="text-sm text-neutral-400 mt-1">
          Enter your pass to verify access. Quota is not consumed yet at this
          step.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs text-neutral-400">Pass</label>
          <input
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full rounded-xl border border-neutral-800 px-3 py-2 outline-none focus:border-neutral-600"
            placeholder="Enter your pass"
          />
        </div>

        {verifyError && (
          <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
            {verifyError}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={verifying}
            className="px-4 py-2 text-sm rounded-xl border border-neutral-700 bg-neutral-100 text-neutral-950 disabled:opacity-50"
          >
            {verifying ? "Verifying..." : "Verify pass"}
          </button>
        </div>
      </form>
    </div>
  );
}