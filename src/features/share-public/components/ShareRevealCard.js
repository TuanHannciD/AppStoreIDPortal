"use client";

/**
 * Card hiển thị trạng thái sau khi verify pass thành công.
 *
 * Có 2 phase chính:
 * 1. verified nhưng chưa reveal
 * 2. reveal xong -> show full account info
 */
export default function ShareRevealCard({
  verifiedInfo,
  accountInfo,
  revealError,
  revealing,
  onReveal,
}) {
  const isRevealed = Boolean(accountInfo);

  function copyText(value) {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
  }

  return (
    <div className="rounded-2xl border border-neutral-800 p-5 space-y-4">
      <div>
        <div className="text-base font-semibold">Account access</div>
        <div className="text-sm text-neutral-400 mt-1">
          Your pass has been verified. Account information is still hidden until
          you explicitly request reveal.
        </div>
      </div>

      {/* Verified summary */}
      <div className="rounded-xl border border-neutral-800 p-4 space-y-2">
        <div className="text-sm font-medium">Verification status</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-neutral-400">Pass label</div>
            <div>{verifiedInfo?.passInfo?.label || "-"}</div>

            <div className="text-neutral-400">Quota total</div>
            <div>{verifiedInfo?.passInfo?.quotaTotal ?? 0}</div>
          </div>

          <div className="grid grid-cols-[140px_1fr] gap-2">
            <div className="text-neutral-400">Quota used</div>
            <div>{verifiedInfo?.passInfo?.quotaUsed ?? 0}</div>

            <div className="text-neutral-400">Remaining quota</div>
            <div>{verifiedInfo?.passInfo?.remainingQuota ?? 0}</div>
          </div>
        </div>
      </div>

      {!isRevealed && (
        <div className="rounded-xl border border-dashed border-neutral-700 p-4 space-y-3">
          <div className="text-sm font-medium">
            Account information is hidden
          </div>
          <div className="text-sm text-neutral-400">
            Click the button below to reveal full account information. Quota
            will be consumed at that time.
          </div>

          {revealError && (
            <div className="rounded-xl border border-red-900/60 bg-red-950/20 p-3 text-sm text-red-200">
              {revealError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onReveal}
              disabled={revealing}
              className="px-4 py-2 text-sm rounded-xl border border-neutral-700 bg-neutral-100 text-neutral-950 disabled:opacity-50"
            >
              {revealing ? "Loading account..." : "View account info"}
            </button>
          </div>
        </div>
      )}

      {isRevealed && (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-4">
          <div className="text-sm font-semibold text-emerald-200">
            Account information revealed
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <FieldRow
              label="Title"
              value={accountInfo?.title}
              onCopy={() => copyText(accountInfo?.title)}
            />
            <FieldRow
              label="Email"
              value={accountInfo?.email}
              onCopy={() => copyText(accountInfo?.email)}
            />
            <FieldRow
              label="Username"
              value={accountInfo?.username}
              onCopy={() => copyText(accountInfo?.username)}
            />
            <FieldRow
              label="Password"
              value={accountInfo?.password}
              onCopy={() => copyText(accountInfo?.password)}
            />
            {/* <FieldRow
              label="2FA Key"
              value={accountInfo?.twoFaKey}
              onCopy={() => copyText(accountInfo?.twoFaKey)}
            />
            <FieldRow
              label="Backup Code"
              value={accountInfo?.backupCode}
              onCopy={() => copyText(accountInfo?.backupCode)}
            /> */}
          </div>

          <div className="space-y-1">
            <div className="text-xs text-emerald-200/70">Note</div>
            <div className="text-sm whitespace-pre-wrap">
              {accountInfo?.note || "-"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, value, onCopy }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black/10 p-3 space-y-2">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="font-mono break-all text-sm">{value || "-"}</div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onCopy}
          className="px-3 py-1 text-xs rounded-lg border border-neutral-700 hover:bg-[rgb(202,202,202)]"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
