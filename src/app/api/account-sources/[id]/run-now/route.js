import { ensureApiSourceCronSchedulerStarted, mapApiSource, runApiSourceCronById } from "@/lib/api-source-cron";

export async function POST(_req, { params }) {
  ensureApiSourceCronSchedulerStarted();

  const id = String(params?.id || "").trim();
  if (!id) {
    return Response.json({ success: false, message: "Nguồn API không tồn tại." }, { status: 404 });
  }

  const result = await runApiSourceCronById(id, { manual: true });
  return Response.json(
    {
      success: result.ok,
      message: result.message,
      detail: result.detail,
      item: result.item ? mapApiSource(result.item) : null,
    },
    { status: result.ok ? 200 : 400 },
  );
}
