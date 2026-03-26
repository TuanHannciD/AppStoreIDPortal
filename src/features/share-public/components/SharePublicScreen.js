"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import {
  fetchShareLinkByCode,
  revealShareAccount,
  validateShareAccessToken,
  verifySharePass,
} from "../api/sharePublic.api";
import { mapSharePublicItem } from "../lib/sharePublic.mapper";
import ShareStatusCard from "./ShareStatusCard";

const SESSION_PREFIX = "share-access-session";
const FALLBACK_GUIDE_STEPS = [
  {
    title: "Đăng nhập App Store",
    description:
      "Mở App Store > Nhấn avatar góc phải > kéo xuống cuối và đăng xuất tài khoản cũ trước khi nhập Apple ID mới.",
  },
  {
    title: "Bỏ qua bảo mật",
    description:
      'Nếu có yêu cầu nâng cấp bảo mật, chọn "Các lựa chọn khác" rồi nhấn "Không nâng cấp" để tiếp tục.',
  },
  {
    title: "Tải ứng dụng",
    description:
      'Vào mục "Đã mua" (Purchased), tìm tên ứng dụng rồi nhấn biểu tượng đám mây để tải về.',
  },
  {
    title: "Đăng xuất an toàn",
    description:
      "Sau khi tải xong, vui lòng đăng xuất ID ngay để tránh bị khóa và nhường lượt cho người dùng khác.",
  },
];
const FALLBACK_FAQS = [
  {
    question: "Tại sao ID bị khóa?",
    answer:
      "Thường do đăng nhập nhầm vào iCloud, sử dụng trên quá nhiều thiết bị hoặc giữ đăng nhập quá lâu sau khi tải xong.",
  },
  {
    question: "Làm sao để cập nhật game?",
    answer:
      "Đăng nhập lại ID thuê trong App Store, mở mục Purchased rồi cập nhật ứng dụng như bình thường.",
  },
  {
    question: "Game đòi mã xác thực 2 bước?",
    answer:
      "Hãy liên hệ nhà cung cấp để được hỗ trợ phiên đăng nhập mới hoặc cấp lại lượt truy cập phù hợp.",
  },
];

export default function SharePublicScreen({ code }) {
  const [loading, setLoading] = useState(true);
  const [loadStatus, setLoadStatus] = useState("LOADING");
  const [loadError, setLoadError] = useState("");
  const [shareItem, setShareItem] = useState(null);

  const [gateOpen, setGateOpen] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [revealError, setRevealError] = useState("");

  const [verifiedInfo, setVerifiedInfo] = useState(null);
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function loadSharePage() {
      setLoading(true);
      setLoadStatus("LOADING");
      setLoadError("");
      setShareItem(null);
      setVerifiedInfo(null);
      setAccountInfo(null);
      setGateOpen(true);
      setVerifyError("");
      setRevealError("");
      setCheckingToken(false);

      try {
        const res = await fetchShareLinkByCode(code);

        if (!res?.success) {
          if (ignore) return;

          if (res?.status === "NOT_FOUND") {
            setLoadStatus("NOT_FOUND");
            setLoadError(res?.message || "Không tìm thấy liên kết truy cập.");
            return;
          }

          if (res?.status === "LINK_EXPIRED") {
            setLoadStatus("LINK_EXPIRED");
            setLoadError(res?.message || "Liên kết này đã hết hạn.");
            return;
          }

          setLoadStatus("ERROR");
          setLoadError(res?.message || "Không thể tải liên kết chia sẻ.");
          return;
        }

        const mappedItem = mapSharePublicItem(res.item);

        if (ignore) return;

        setShareItem(mappedItem);
        setLoadStatus("READY");

        const session = readAccessSession(code);
        if (session?.verificationToken) {
          setCheckingToken(true);
          const validateRes = await validateShareAccessToken(code, {
            verificationToken: session.verificationToken,
          });

          if (ignore) return;

          if (validateRes?.success) {
            setVerifiedInfo({
              verificationToken: session.verificationToken,
              passInfo: validateRes.passInfo,
              expiresAt: validateRes.expiresAt,
            });
            setGateOpen(false);
          } else {
            clearAccessSession(code);
            setGateOpen(true);
          }

          setCheckingToken(false);
        }
      } catch (err) {
        if (ignore) return;
        setLoadStatus("ERROR");
        setLoadError(String(err?.message || err));
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadSharePage();

    return () => {
      ignore = true;
    };
  }, [code]);

  async function handleVerify(pass) {
    setVerifyError("");
    setRevealError("");
    setVerifying(true);

    try {
      const verifyRes = await verifySharePass(code, { pass });

      if (!verifyRes?.success) {
        switch (verifyRes?.status) {
          case "INVALID_PASS":
            setVerifyError("Mật khẩu truy cập không đúng. Vui lòng thử lại.");
            break;
          case "PASS_REVOKED":
            setVerifyError(verifyRes?.message || "Mật khẩu này đã bị thu hồi.");
            break;
          case "PASS_EXPIRED":
            setVerifyError(verifyRes?.message || "Mật khẩu này đã hết hạn.");
            break;
          case "QUOTA_EXHAUSTED":
            setVerifyError(
              verifyRes?.message || "Lượt truy cập đã được sử dụng hết.",
            );
            break;
          case "LINK_EXPIRED":
            clearAccessSession(code);
            setLoadStatus("LINK_EXPIRED");
            setLoadError(verifyRes?.message || "Liên kết này đã hết hạn.");
            break;
          default:
            setVerifyError(
              verifyRes?.message || "Không thể xác thực mật khẩu.",
            );
            break;
        }
        return;
      }

      const nextVerifiedInfo = {
        verificationToken: verifyRes.verificationToken,
        passInfo: verifyRes.passInfo,
        expiresAt: verifyRes.expiresAt || null,
      };

      setVerifiedInfo(nextVerifiedInfo);
      setAccountInfo(null);
      setGateOpen(false);
      writeAccessSession(code, {
        verificationToken: verifyRes.verificationToken,
      });
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
      const revealRes = await revealShareAccount(code, {
        verificationToken: verifiedInfo.verificationToken,
      });

      if (!revealRes?.success) {
        switch (revealRes?.status) {
          case "TOKEN_INVALID":
          case "TOKEN_CONSUMED":
          case "TOKEN_EXPIRED":
            expireAccessSession();
            setRevealError(
              "Phiên xác thực đã hết hiệu lực. Vui lòng nhập lại mật khẩu.",
            );
            break;
          case "NO_ACCOUNT_AVAILABLE":
          case "SYNC_ACCOUNT_UNAVAILABLE":
            setRevealError(
              revealRes?.message ||
                "Hiện chưa có tài khoản khả dụng cho liên kết này.",
            );
            break;
          case "QUOTA_EXHAUSTED":
            setRevealError(
              revealRes?.message || "Lượt truy cập đã được sử dụng hết.",
            );
            break;
          case "PASS_REVOKED":
          case "PASS_EXPIRED":
            expireAccessSession();
            setRevealError(
              revealRes?.message || "Mật khẩu truy cập không còn hiệu lực.",
            );
            break;
          default:
            setRevealError(
              revealRes?.message || "Không thể tải nội dung bảo vệ.",
            );
            break;
        }
        return;
      }

      const nextVerifiedInfo = {
        ...verifiedInfo,
        passInfo: {
          ...verifiedInfo?.passInfo,
          quotaUsed: (verifiedInfo?.passInfo?.quotaUsed ?? 0) + 1,
          remainingQuota: revealRes.remainingQuota,
        },
      };

      setVerifiedInfo(nextVerifiedInfo);
      setAccountInfo(revealRes.account);
    } catch (err) {
      setRevealError(String(err?.message || err));
    } finally {
      setRevealing(false);
    }
  }

  const pageTitle = useMemo(() => {
    if (!shareItem?.app?.name) return "Appstoreviet";
    return shareItem.app.name;
  }, [shareItem]);

  function expireAccessSession() {
    clearAccessSession(code);
    setVerifiedInfo(null);
    setAccountInfo(null);
    setGateOpen(true);
  }

  if (loading || loadStatus === "LOADING") {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-10 text-center text-sm text-slate-500 shadow-[0_30px_80px_rgba(15,23,42,0.08)]">
        Đang tải liên kết truy cập...
      </div>
    );
  }

  if (loadStatus === "NOT_FOUND") {
    return (
      <ShareStatusCard
        status="error"
        title="Không tìm thấy liên kết"
        message={loadError || "Liên kết bạn truy cập hiện không tồn tại."}
      />
    );
  }

  if (loadStatus === "LINK_EXPIRED") {
    return (
      <ShareStatusCard
        status="error"
        title="Liên kết đã hết hạn"
        message={loadError || "Liên kết truy cập này đã hết hạn."}
      />
    );
  }

  if (loadStatus === "ERROR") {
    return (
      <ShareStatusCard
        status="error"
        title="Không thể tải nội dung"
        message={loadError || "Đã xảy ra lỗi ngoài mong muốn."}
      />
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] sm:rounded-[28px] lg:rounded-[32px] lg:shadow-[0_30px_90px_rgba(15,23,42,0.12)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#f7faff_100%)]" />

      <div
        className={`relative ${gateOpen ? "pointer-events-none select-none blur-[2px]" : ""}`}
      >
        <ShareMainContent
          shareItem={shareItem}
          accountInfo={accountInfo}
          verifiedInfo={verifiedInfo}
          pageTitle={pageTitle}
          revealError={revealError}
          revealing={revealing}
          checkingToken={checkingToken}
          onReveal={handleReveal}
        />
      </div>

      {gateOpen && !checkingToken && (
        <ShareAccessOverlay
          appName={pageTitle}
          verifying={verifying}
          verifyError={verifyError}
          onVerify={handleVerify}
        />
      )}
    </div>
  );
}

function ShareMainContent({
  shareItem,
  accountInfo,
  verifiedInfo,
  pageTitle,
  revealError,
  revealing,
  checkingToken,
  onReveal,
}) {
  const [showPassword, setShowPassword] = useState(false);

  function copyText(value) {
    if (!value) return;
    navigator.clipboard?.writeText(String(value));
  }

  const remainingQuota = verifiedInfo?.passInfo?.remainingQuota;
  const quotaText =
    typeof remainingQuota === "number" ? `${remainingQuota}` : "-";
  const totalQuota =
    typeof verifiedInfo?.passInfo?.quotaTotal === "number"
      ? `${verifiedInfo.passInfo.quotaTotal}`
      : "-";
  const isVerified = Boolean(verifiedInfo?.verificationToken);
  const isRevealed = Boolean(accountInfo);

  return (
    <div className="min-h-[min(100dvh,900px)] px-3 py-3 sm:px-4 sm:py-4 lg:px-5 lg:py-5">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 sm:max-w-2xl sm:gap-5 lg:max-w-6xl lg:gap-6">
        <header className="flex items-center justify-between border-b border-slate-200 pb-3 sm:pb-3.5 lg:pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner sm:h-10 sm:w-10 lg:h-11 lg:w-11">
              <Smartphone
                size={18}
                className="sm:h-[19px] sm:w-[19px] lg:h-5 lg:w-5"
              />
            </div>
            <div className="text-base font-bold tracking-[-0.03em] text-slate-900 sm:text-[17px] lg:text-[18px]">
              Appstoreviet
            </div>
          </div>

          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-500 text-white shadow-sm sm:h-9 sm:w-9"
            aria-label="Trợ giúp"
          >
            <HelpCircle size={16} className="sm:h-[18px] sm:w-[18px]" />
          </button>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)] lg:items-start xl:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)]">
          <section className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-slate-200/80 bg-white/80 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[24px] sm:p-4 lg:rounded-[26px] lg:p-5">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-[92px] w-[92px] rounded-[20px] bg-[radial-gradient(circle_at_35%_30%,rgba(74,222,128,0.55),transparent_24%),radial-gradient(circle_at_66%_72%,rgba(249,115,22,0.45),transparent_18%),linear-gradient(135deg,#07111f_0%,#111e33_50%,#0a0f19_100%)] shadow-[0_14px_30px_rgba(15,23,42,0.20)] ring-1 ring-white/70 sm:h-[104px] sm:w-[104px] sm:rounded-[22px] lg:h-[116px] lg:w-[116px] lg:rounded-[24px]" />
                <div className="space-y-1">
                  <h1 className="text-[22px] font-extrabold tracking-[-0.05em] text-slate-950 sm:text-[26px] lg:text-[30px]">
                    {pageTitle}
                  </h1>
                  <p className="text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6 lg:text-[15px]">
                    Nội dung Apple ID được bảo vệ bằng mật khẩu truy cập và chỉ
                    hiển thị sau khi xác thực thành công.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <MetricCard label="Còn lại" value={quotaText} tone="blue" />
              <MetricCard label="Tổng lượt" value={totalQuota} tone="violet" />
              <MetricCard
                label="Hết hạn"
                value={formatShortDate(shareItem?.expiresAt)}
                tone="amber"
              />
            </div>

            <div className="rounded-[18px] border border-emerald-100 bg-emerald-50/70 p-3.5 shadow-sm sm:rounded-[20px] sm:p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:h-9 sm:w-9">
                    <ShieldCheck size={15} />
                  </span>
                  <div>
                    <div className="text-[13px] font-semibold text-emerald-900 sm:text-sm">
                      {checkingToken
                        ? "Đang kiểm tra token"
                        : isVerified
                          ? "Đã xác thực"
                          : "Đang bảo vệ"}
                    </div>
                    <div className="text-[11px] text-emerald-700 sm:text-xs">
                      {checkingToken
                        ? "Hệ thống đang xác nhận token trước khi cho qua bước reveal."
                        : isRevealed
                          ? "Thông tin đã được mở khóa và sẵn sàng sử dụng."
                          : isVerified
                            ? "Bạn đã xác thực thành công. Hãy bấm mở khóa để xem thông tin đầy đủ."
                            : "Vui lòng xác thực bằng mật khẩu để tiếp tục."}
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600 sm:px-3 sm:text-xs">
                  {isRevealed ? "Mở" : isVerified ? "Bước 1" : "Khóa"}
                </span>
              </div>
            </div>

            <div className="rounded-[18px] border border-rose-200 bg-rose-50 p-3.5 text-[13px] leading-5 text-rose-700 shadow-sm sm:rounded-[20px] sm:p-4 sm:text-sm sm:leading-6">
              <div className="mb-1 flex items-center gap-2 font-semibold text-rose-800">
                <AlertTriangle size={16} />
                <span>Cảnh báo quan trọng</span>
              </div>
              <p>
                Tuyệt đối không đăng nhập vào iCloud trong Cài đặt. Chỉ đăng
                nhập trong App Store để tránh khóa tài khoản.
              </p>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white/85 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[22px] sm:p-4 lg:rounded-[24px]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Hướng dẫn sử dụng
              </div>
              <div className="rounded-[16px] bg-[linear-gradient(180deg,#dfe8f4_0%,#b8c7d9_55%,#7f8995_100%)] px-4 pb-4 pt-14 text-white shadow-inner sm:rounded-[18px] sm:pt-16 lg:pt-18">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-white/15 backdrop-blur sm:h-11 sm:w-11">
                  <ChevronDown className="rotate-[-90deg]" size={18} />
                </div>
                <div className="text-[13px] font-semibold sm:text-sm">
                  Xem video hướng dẫn lấy ID
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-2.5 sm:gap-3">
                {FALLBACK_GUIDE_STEPS.map((step, index) => (
                  <div
                    key={step.title}
                    className="grid grid-cols-[30px_1fr] gap-3 sm:grid-cols-[32px_1fr]"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600 sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm">
                      {index + 1}
                    </div>
                    <div className="rounded-[16px] border border-slate-200 bg-slate-50/80 p-3 sm:rounded-[18px] sm:p-3.5">
                      <div className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                        {step.title}
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-4">
            <div className="rounded-[20px] border border-slate-200 bg-white/90 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[22px] sm:p-4 lg:rounded-[24px]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Thông tin đăng nhập
                </div>
                {isVerified && !isRevealed && (
                  <button
                    type="button"
                    onClick={onReveal}
                    disabled={revealing}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 sm:px-4 sm:text-xs"
                  >
                    {revealing ? "Đang mở khóa..." : "Mở khóa bước 2"}
                  </button>
                )}
              </div>

              {!isVerified && (
                <div className="mb-4 rounded-[16px] border border-slate-200 bg-slate-50 px-3.5 py-3 text-[13px] text-slate-500 sm:rounded-[18px] sm:px-4 sm:text-sm">
                  Xác thực mật khẩu ở lớp bảo vệ phía trên để lấy token truy cập
                  trước khi xem thông tin ID.
                </div>
              )}

              {isVerified && !isRevealed && (
                <div className="mb-4 rounded-[16px] border border-blue-200 bg-blue-50 px-3.5 py-3 text-[13px] leading-5 text-blue-700 sm:rounded-[18px] sm:px-4 sm:text-sm sm:leading-6">
                  Bước 1 đã hoàn tất. Token truy cập hợp lệ, hãy bấm{" "}
                  <strong>Mở khóa bước 2</strong> để xem thông tin tài khoản.{" "}
                  <br />
                  <strong className="text-red-700">
                    Lưu ý: Thời gian để xem account sẽ có hạn là 30 giây. Hết
                    thời gian hoặc xem bước 2 rồi tải lại trang sẽ yêu cầu nhập
                    lại pass và tính 1 lượt xem mới!.
                  </strong>
                </div>
              )}

              <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-slate-50/70 sm:rounded-[18px]">
                <CredentialRow
                  label="Apple ID"
                  value={
                    accountInfo?.email ||
                    accountInfo?.username ||
                    "Đang chờ mở khóa"
                  }
                  onCopy={() =>
                    copyText(accountInfo?.email || accountInfo?.username)
                  }
                />
                <div className="h-px bg-slate-200" />
                <CredentialRow
                  label="Mật khẩu"
                  value={
                    showPassword
                      ? accountInfo?.password || "Đang chờ mở khóa"
                      : maskPassword(accountInfo?.password)
                  }
                  onCopy={() => copyText(accountInfo?.password)}
                  onToggleVisible={() => setShowPassword((prev) => !prev)}
                  isPassword
                  showingPassword={showPassword}
                />
              </div>

              {accountInfo?.note && (
                <div className="mt-4 rounded-[16px] border border-slate-200 bg-white p-3.5 text-[13px] leading-5 text-slate-500 sm:rounded-[18px] sm:p-4 sm:text-sm sm:leading-6">
                  <div className="mb-1 font-semibold text-slate-800">
                    Ghi chú
                  </div>
                  {accountInfo.note}
                </div>
              )}

              {revealError && (
                <div className="mt-4 rounded-[16px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-700 sm:rounded-[18px] sm:px-4 sm:text-sm">
                  {revealError}
                </div>
              )}
            </div>

            <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-3.5 shadow-sm sm:rounded-[20px] sm:p-4">
              <div className="mb-1 text-[13px] font-semibold text-amber-900 sm:text-sm">
                Lưu ý về DLC & In-App
              </div>
              <p className="text-[13px] leading-5 text-amber-800 sm:text-sm sm:leading-6">
                Với game có DLC hoặc mua trong ứng dụng, hãy mở game ít nhất 1
                lần khi vẫn đang đăng nhập ID thuê để kích hoạt nội dung trước
                khi đăng xuất.
              </p>
            </div>

            <div className="rounded-[20px] border border-slate-200 bg-white/90 p-3.5 shadow-[0_16px_40px_rgba(15,23,42,0.06)] sm:rounded-[22px] sm:p-4 lg:rounded-[24px]">
              <div className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Câu hỏi thường gặp
              </div>
              <div className="space-y-2.5 sm:space-y-3">
                {FALLBACK_FAQS.map((faq) => (
                  <details
                    key={faq.question}
                    className="group rounded-[16px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 sm:rounded-[18px] sm:px-4"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-medium text-slate-800 sm:text-sm">
                      <span>{faq.question}</span>
                      <ChevronDown
                        size={16}
                        className="text-slate-400 transition group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-3 text-[13px] leading-5 text-slate-500 sm:text-sm sm:leading-6">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ShareAccessOverlay({ appName, verifying, verifyError, onVerify }) {
  const [pass, setPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    await onVerify(pass);
  }

  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-white/70 px-3 py-4 backdrop-blur-[10px] sm:px-5 sm:py-6 lg:px-8">
      <div className="relative flex w-full max-w-[380px] justify-center py-1 sm:max-w-[400px] sm:py-3">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-[20px] border border-white/70 bg-white/92 px-4 py-5 text-center shadow-[0_24px_60px_rgba(15,23,42,0.18)] sm:rounded-[24px] sm:px-5 sm:py-6"
        >
          <div className="mx-auto mb-5 flex h-[84px] w-[84px] items-center justify-center rounded-[18px] bg-[radial-gradient(circle_at_35%_30%,rgba(74,222,128,0.55),transparent_24%),radial-gradient(circle_at_66%_72%,rgba(249,115,22,0.45),transparent_18%),linear-gradient(135deg,#07111f_0%,#111e33_50%,#0a0f19_100%)] shadow-[0_16px_36px_rgba(15,23,42,0.22)] ring-1 ring-white/70 sm:mb-6 sm:h-[96px] sm:w-[96px] sm:rounded-[20px]" />

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 sm:mb-4 sm:h-16 sm:w-16">
            <Lock size={24} className="sm:h-7 sm:w-7" />
          </div>

          <h2 className="text-[22px] font-extrabold tracking-[-0.05em] text-slate-950 sm:text-[26px]">
            Nội dung này được bảo vệ
          </h2>
          <p className="mx-auto mt-3 max-w-[300px] text-[14px] leading-6 text-slate-500 sm:text-[15px] sm:leading-7">
            Vui lòng nhập mật khẩu truy cập để hoàn tất bước 1 và lấy token truy
            cập cho {appName}.
          </p>

          <div className="mt-5 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 shadow-inner sm:mt-6 sm:rounded-[20px] sm:px-4 sm:py-3.5">
            <label className="flex items-center gap-3">
              <span className="text-slate-400">
                <KeyRound size={18} className="sm:h-5 sm:w-5" />
              </span>
              <input
                value={pass}
                onChange={(event) => setPass(event.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                className="w-full border-0 bg-transparent text-[15px] text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              />
              <button
                type="button"
                className="text-slate-400"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPassword ? (
                  <EyeOff size={18} className="sm:h-5 sm:w-5" />
                ) : (
                  <Eye size={18} className="sm:h-5 sm:w-5" />
                )}
              </button>
            </label>
          </div>

          {verifyError && (
            <div className="mt-4 rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-left text-[13px] leading-5 text-rose-700 sm:text-sm sm:leading-6">
              {verifyError}
            </div>
          )}

          <button
            type="submit"
            disabled={verifying}
            className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-[18px] bg-blue-600 px-5 py-3.5 text-base font-bold text-white shadow-[0_18px_32px_rgba(37,99,235,0.34)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70 sm:mt-6 sm:rounded-[20px] sm:px-6 sm:py-4 sm:text-lg"
          >
            {verifying ? "Đang xác thực..." : "Xác thực bước 1"}
            <ChevronDown className="rotate-[-90deg]" size={18} />
          </button>

          <div className="mt-6 text-xs text-slate-400 sm:mt-7 sm:text-sm">
            © 2026 Appstoreviet. Bảo mật tuyệt đối.
          </div>
        </form>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone = "blue" }) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <article className="rounded-[16px] border border-slate-200 bg-white/85 p-2.5 text-center shadow-[0_15px_35px_rgba(15,23,42,0.06)] sm:rounded-[18px] sm:p-3">
      <div
        className={`mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${toneMap[tone] || toneMap.blue} sm:mb-2.5 sm:h-8 sm:w-8`}
      >
        <CheckCircle2 size={14} />
      </div>
      <div className="text-[10px] font-medium text-slate-400 sm:text-[11px]">
        {label}
      </div>
      <div className="mt-1 text-base font-extrabold tracking-[-0.04em] text-slate-950 sm:mt-1.5 sm:text-lg">
        {value}
      </div>
    </article>
  );
}

function CredentialRow({
  label,
  value,
  onCopy,
  onToggleVisible,
  isPassword = false,
  showingPassword = false,
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3.5 sm:px-3.5 sm:py-4">
      <div className="col-span-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
      <div
        className={`text-[13px] leading-6 text-slate-900 sm:text-sm sm:leading-7 ${isPassword ? "tracking-[0.2em]" : ""}`}
      >
        {value}
      </div>
      <div className="flex items-start gap-2">
        {isPassword && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label={showingPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showingPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={`Sao chép ${label}`}
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}

function formatShortDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function maskPassword(value) {
  if (!value) return "Đang chờ mở khóa";
  return "* ".repeat(Math.max(value.length, 8)).trim();
}

function getSessionKey(code) {
  return `${SESSION_PREFIX}:${code}`;
}

function readAccessSession(code) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(getSessionKey(code));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAccessSession(code, value) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(getSessionKey(code), JSON.stringify(value));
  } catch {
    // noop
  }
}

function clearAccessSession(code) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(getSessionKey(code));
  } catch {
    // noop
  }
}
