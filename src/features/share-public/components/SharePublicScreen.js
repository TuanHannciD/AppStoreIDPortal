"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchShareLinkByCode,
  revealShareAccount,
  verifySharePass,
} from "../api/sharePublic.api";
import { mapSharePublicItem } from "../lib/sharePublic.mapper";
import SharePassVerifyCard from "./SharePassVerifyCard";
import ShareRevealCard from "./ShareRevealCard";
import ShareStatusCard from "./ShareStatusCard";

/**
 * State machine đơn giản cho public share flow.
 *
 * Phân tách rõ:
 * - load link metadata
 * - verify pass
 * - reveal account
 */
export default function SharePublicScreen({ code }) {
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("LOADING");
  const [loadError, setLoadError] = useState("");
  const [shareItem, setShareItem] = useState(null);

  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [verifiedInfo, setVerifiedInfo] = useState(null);

  const [revealing, setRevealing] = useState(false);
  const [revealError, setRevealError] = useState("");
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadStatus("LOADING");
      setLoadError("");
      setShareItem(null);

      try {
        const res = await fetchShareLinkByCode(code);

        if (!res?.success) {
          if (res?.status === "NOT_FOUND") {
            setLoadStatus("NOT_FOUND");
            setLoadError(res?.message || "Share link not found");
            return;
          }

          if (res?.status === "LINK_EXPIRED") {
            setLoadStatus("LINK_EXPIRED");
            setLoadError(res?.message || "This share link has expired");
            return;
          }

          setLoadStatus("ERROR");
          setLoadError(res?.message || "Failed to load share link");
          return;
        }

        setShareItem(mapSharePublicItem(res.item));
        setLoadStatus("READY");
      } catch (err) {
        setLoadStatus("ERROR");
        setLoadError(String(err?.message || err));
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  async function handleVerify(pass) {
    setVerifyError("");
    setRevealError("");
    setAccountInfo(null);
    setVerifiedInfo(null);

    setVerifying(true);
    try {
      const res = await verifySharePass(code, { pass });

      if (!res?.success) {
        switch (res?.status) {
          case "INVALID_PASS":
            setVerifyError("Invalid pass. Please try again.");
            break;
          case "PASS_REVOKED":
            setVerifyError(res?.message || "This pass has been revoked.");
            break;
          case "PASS_EXPIRED":
            setVerifyError(res?.message || "This pass has expired.");
            break;
          case "QUOTA_EXHAUSTED":
            setVerifyError(res?.message || "Quota has been exhausted.");
            break;
          case "LINK_EXPIRED":
            setLoadStatus("LINK_EXPIRED");
            setLoadError(res?.message || "This share link has expired.");
            break;
          default:
            setVerifyError(res?.message || "Failed to verify pass.");
            break;
        }
        return;
      }

      setVerifiedInfo(res);
    } catch (err) {
      setVerifyError(String(err?.message || err));
    } finally {
      setVerifying(false);
    }
  }

  async function handleReveal() {
    if (!verifiedInfo?.verificationToken) return;

    setRevealError("");
    setRevealing(true);

    try {
      const res = await revealShareAccount(code, {
        verificationToken: verifiedInfo.verificationToken,
      });

      if (!res?.success) {
        switch (res?.status) {
          case "TOKEN_INVALID":
            setRevealError("Verification token is invalid.");
            break;
          case "TOKEN_CONSUMED":
            setRevealError("This verification token has already been used.");
            break;
          case "TOKEN_EXPIRED":
            setRevealError(
              "Verification token has expired. Please verify again.",
            );
            break;
          case "NO_ACCOUNT_AVAILABLE":
            setRevealError("No account is currently available for this link.");
            break;
          case "QUOTA_EXHAUSTED":
            setRevealError("Quota has been exhausted.");
            break;
          case "PASS_REVOKED":
            setRevealError(res?.message || "This pass has been revoked.");
            break;
          case "PASS_EXPIRED":
            setRevealError(res?.message || "This pass has expired.");
            break;
          default:
            setRevealError(res?.message || "Failed to reveal account info.");
            break;
        }
        return;
      }

      // CHANGED:
      // Sau khi reveal thành công, cập nhật lại verifiedInfo.remainingQuota
      // để UI phản ánh số quota còn lại mới nhất.
      setVerifiedInfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          passInfo: {
            ...prev.passInfo,
            quotaUsed: (prev.passInfo?.quotaUsed ?? 0) + 1,
            remainingQuota: res.remainingQuota,
          },
        };
      });

      setAccountInfo(res.account);
    } catch (err) {
      setRevealError(String(err?.message || err));
    } finally {
      setRevealing(false);
    }
  }

  const titleText = useMemo(() => {
    if (!shareItem?.app?.name) return "Shared access";
    return shareItem.app.name;
  }, [shareItem]);

  if (loading || loadStatus === "LOADING") {
    return (
      <div className="rounded-2xl border border-neutral-800 p-6 text-sm text-neutral-400">
        Loading share link...
      </div>
    );
  }

  if (loadStatus === "NOT_FOUND") {
    return (
      <ShareStatusCard
        status="error"
        title="Share link not found"
        message={loadError || "The requested share link does not exist."}
      />
    );
  }

  if (loadStatus === "LINK_EXPIRED") {
    return (
      <ShareStatusCard
        status="error"
        title="Share link expired"
        message={loadError || "This share link has expired."}
      />
    );
  }

  if (loadStatus === "ERROR") {
    return (
      <ShareStatusCard
        status="error"
        title="Unable to load share link"
        message={loadError || "An unexpected error occurred."}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Public header */}
      <div className="rounded-2xl border border-neutral-800 p-5 space-y-4">
        <div>
          <div className="text-xl font-semibold">{titleText}</div>
          <div className="text-sm text-neutral-400 mt-1">
            Secure share link with pass verification and controlled account
            reveal.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div className="text-neutral-400">Code</div>
            <div className="font-mono">{shareItem?.code || "-"}</div>

            <div className="text-neutral-400">App slug</div>
            <div>{shareItem?.app?.slug || "-"}</div>

            <div className="text-neutral-400">Package type</div>
            <div>{shareItem?.app?.packageType || "-"}</div>
          </div>

          <div className="grid grid-cols-[120px_1fr] gap-2">
            <div className="text-neutral-400">Expires at</div>
            <div>{formatDateTime(shareItem?.expiresAt)}</div>

            <div className="text-neutral-400">Quota policy</div>
            <div>
              {shareItem?.consumeOnVerify
                ? "Consume on verify"
                : "Consume on reveal"}
            </div>

            <div className="text-neutral-400">Description</div>
            <div>{shareItem?.app?.description || "-"}</div>
          </div>
        </div>

        {shareItem?.note && (
          <div className="rounded-xl border border-neutral-800 p-3">
            <div className="text-xs text-neutral-400 mb-1">Note</div>
            <div className="text-sm whitespace-pre-wrap">{shareItem.note}</div>
          </div>
        )}
      </div>

      {/* Verify card */}
      {!verifiedInfo && (
        <SharePassVerifyCard
          onVerify={handleVerify}
          verifying={verifying}
          verifyError={verifyError}
        />
      )}

      {/* Reveal card */}
      {verifiedInfo && (
        <ShareRevealCard
          verifiedInfo={verifiedInfo}
          accountInfo={accountInfo}
          revealError={revealError}
          revealing={revealing}
          onReveal={handleReveal}
        />
      )}
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}
