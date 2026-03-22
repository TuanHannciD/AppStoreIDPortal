"use client";

import { useMemo, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { formatDate, maskEmail, maskSecret } from "@/lib/utils";

function canUseClipboard() {
  return typeof navigator !== "undefined" && !!navigator.clipboard?.writeText;
}

export default function CredentialPanel({ app }) {
  const { pushToast } = useToast();
  const credentials = app?.credentials;

  const [revealed, setRevealed] = useState(false);
  const [lastRevealedAt, setLastRevealedAt] = useState(
    credentials?.lastRevealedAt || null,
  );

  const accountMasked = useMemo(
    () => maskEmail(credentials?.accountEmail),
    [credentials?.accountEmail],
  );
  const passwordMasked = useMemo(
    () =>
      revealed ? credentials?.password : maskSecret(credentials?.password),
    [revealed, credentials?.password],
  );

  function toggleReveal() {
    if (!credentials) return;

    // Example: if LOCKED/COOLDOWN, you would block reveal here after integrating real status.
    setRevealed((prev) => {
      const next = !prev;
      if (next) {
        const iso = new Date().toISOString();
        setLastRevealedAt(iso);
        pushToast({
          title: "Password revealed",
          message: "Remember to sign out after download/verification.",
          intent: "warning",
        });
      }
      return next;
    });
  }

  async function copy(value, label) {
    if (!value) return;
    if (!canUseClipboard()) {
      pushToast({
        title: "Copy not available",
        message: "Clipboard API is not available in this browser context.",
        intent: "danger",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      pushToast({
        title: "Copied",
        message: `${label} copied to clipboard.`,
        intent: "success",
      });
    } catch {
      pushToast({
        title: "Copy failed",
        message: "Unable to copy to clipboard.",
        intent: "danger",
      });
    }
  }

  const lastRevealedLabel = lastRevealedAt
    ? formatDate(new Date(lastRevealedAt))
    : "Never";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Credential access</h2>
          <p className="mt-1 text-sm text-slate-600">
            Account and password are mock values for UI flow.
          </p>
        </div>
        <StatusBadge status={credentials?.status || "UNKNOWN"} />
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="grid gap-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Account
                </div>
              </div>
              <div className="sm:col-span-7">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm">
                  {revealed ? credentials?.accountEmail : accountMasked}
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => copy(credentials?.accountEmail, "Account")}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Password
                </div>
              </div>
              <div className="sm:col-span-7">
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 font-mono text-sm">
                  {passwordMasked}
                </div>
              </div>
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!revealed) {
                      pushToast({
                        title: "Reveal first",
                        message: "Reveal the password before copying it.",
                        intent: "warning",
                      });
                      return;
                    }
                    copy(credentials?.password, "Password");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Last revealed:{" "}
                <span className="font-medium text-slate-700">
                  {lastRevealedLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={toggleReveal}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                {revealed ? "Hide password" : "Reveal password"}
              </button>
            </div>
          </div>
        </div>

        {Array.isArray(credentials?.notes) && credentials.notes.length > 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Important
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {credentials.notes.map((n, idx) => (
                <li key={idx}>{n}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm font-semibold text-amber-900">
            Security reminder
          </div>
          <p className="mt-1 text-sm text-amber-900/80">
            Credentials are sensitive. Do not share, do not change account
            settings, and sign out after usage.
          </p>
        </div>
      </div>
    </div>
  );
}
