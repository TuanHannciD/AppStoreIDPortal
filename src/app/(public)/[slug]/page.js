import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import CredentialPanel from "@/components/CredentialPanel";
import FaqAccordion from "@/components/FaqAccordion";
import GuidePanel from "@/components/GuidePanel";
import SpecialAlert from "@/components/SpecialAlert";
import StatusBadge from "@/components/StatusBadge";
import { getAppBySlug, isSpecialPackageType } from "@/lib/mock-data";
import { formatDate, formatDaysLeft } from "@/lib/utils";

export default function AppDetailPage({ params }) {
  const app = getAppBySlug(params.slug);
  if (!app) notFound();

  const expiry = new Date(app.subscription.expiresAt);
  const isSpecial = isSpecialPackageType(app.packageType);

  return (
    <div className="space-y-6">
      <PageHeader
        title={app.name}
        subtitle={
          <span>
            Slug: <span className="font-mono text-slate-700">/{app.slug}</span>{" "}
            · Package:{" "}
            <span className="font-mono text-slate-700">{app.packageType}</span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={app.subscription.status} />
          </div>
        }
      />

      {isSpecial && (
        <SpecialAlert
          packageType={app.packageType}
          message={
            app.packageType === "FULL_DLC"
              ? "FULL_DLC: Sau khi tải xuống các nội dung DLC, hãy mở ứng dụng một lần trước khi đăng xuất ID để đảm bảo các nội dung này đã được kích hoạt."
              : "FULL_INAPP: Sau khi mua hoặc tải xuống, hãy mở ứng dụng và xác nhận các vật phẩm đã xuất hiện trước khi đăng xuất tài khoản ID."
          }
        />
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
        <div className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                App overview
              </div>
              <div className="mt-1 text-sm text-slate-600">
                {app.description}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                App banner
              </div>
              <div className="mt-2 flex h-12 w-56 items-center justify-center rounded-lg bg-gradient-to-r from-slate-200 to-slate-100 text-xs text-slate-500">
                Placeholder image
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              title="Remaining total quota"
              value={`${app.subscription.quotaRemainingTotal} / ${app.subscription.quotaTotal}`}
              hint="Total remaining usage across the subscription."
            />
            <SummaryCard
              title="Monthly usage"
              value={`${app.subscription.monthlyUsed} used · ${app.subscription.monthlyRemaining} remaining`}
              hint="Resets monthly."
            />
            <SummaryCard
              title="Time remaining"
              value={`${formatDaysLeft(expiry)} days`}
              hint={`Expires on ${formatDate(expiry)}.`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-6">
          <CredentialPanel app={app} />
        </section>

        <section className="space-y-6 lg:col-span-6">
          <div id="faq" />
          <FaqAccordion items={app.faq} />

          <div id="guide" />
          <GuidePanel
            title="Usage guide"
            steps={app.guide.steps}
            notes={app.guide.notes}
          />
        </section>
      </div>
    </div>
  );
}
