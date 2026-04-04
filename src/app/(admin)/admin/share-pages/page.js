import { Suspense } from "react";
import ShareLinkAdminScreen from "@/features/share-pages/components/ShareLinkAdminScreen";

function ShareLinksPageFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-4 w-72 rounded bg-slate-100" />
      </div>

      <div className="rounded-md border p-6 text-sm text-muted-foreground">
        Đang tải danh sách share link...
      </div>
    </div>
  );
}

export default function SharePagesListPage() {
  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <Suspense fallback={<ShareLinksPageFallback />}>
          <ShareLinkAdminScreen />
        </Suspense>
      </div>
    </div>
  );
}
