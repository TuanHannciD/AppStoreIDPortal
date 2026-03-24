import { ensureApiSourceCronSchedulerStarted } from "@/lib/api-source-cron";
import { mapAppAccount, syncAppAccountById } from "@/lib/app-account-sync";

export async function POST(_req, { params }) {
  ensureApiSourceCronSchedulerStarted();

  const appId = String(params?.appId || "").trim();
  const accountId = String(params?.accountId || "").trim();

  const result = await syncAppAccountById({ appId, accountId });

  return Response.json(
    {
      success: result.ok,
      message: result.message,
      detail: result.detail,
      item: result.item ? mapAppAccount(result.item) : null,
    },
    { status: result.httpStatus || (result.ok ? 200 : 500) },
  );
}
