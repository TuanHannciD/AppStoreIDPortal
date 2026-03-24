import { ensureApiSourceCronSchedulerStarted, mapApiSource } from "@/lib/api-source-cron";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createApiSourceSchema = z.object({
  name: z.string().trim().min(1, "Tên nguồn API là bắt buộc."),
  baseUrl: z.string().trim().url("Base URL không hợp lệ."),
  isActive: z.boolean().optional(),
  cronEnabled: z.boolean().optional(),
  cronIntervalHours: z.number().int().min(1).optional().nullable(),
  cronMaxAccountsPerRun: z.number().int().min(1).optional().nullable(),
});

export async function GET(req) {
  ensureApiSourceCronSchedulerStarted();

  try {
    const activeOnly = req.nextUrl.searchParams.get("activeOnly");
    const items = await prisma.apiSourceConfig.findMany({
      where: activeOnly === "1" || activeOnly === "true" ? { isActive: true } : undefined,
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });

    return Response.json({ success: true, items: items.map(mapApiSource) });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Không thể tải danh sách nguồn API.",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = createApiSourceSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    const created = await prisma.apiSourceConfig.create({
      data: {
        name: parsed.data.name,
        baseUrl: parsed.data.baseUrl.replace(/\/+$/, ""),
        isActive: parsed.data.isActive ?? true,
        cronEnabled: parsed.data.cronEnabled ?? false,
        cronIntervalHours: parsed.data.cronIntervalHours ?? null,
        cronMaxAccountsPerRun: parsed.data.cronMaxAccountsPerRun ?? null,
        cronStatus: parsed.data.cronEnabled ? "READY" : "DISABLED",
        nextCronRunAt: parsed.data.cronEnabled && parsed.data.cronIntervalHours
          ? new Date(Date.now() + parsed.data.cronIntervalHours * 60 * 60 * 1000)
          : null,
      },
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    return Response.json({ success: true, item: mapApiSource(created) }, { status: 201 });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Không thể tạo nguồn API.",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
