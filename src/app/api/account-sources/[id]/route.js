import { ensureApiSourceCronSchedulerStarted, mapApiSource } from "@/lib/api-source-cron";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateApiSourceSchema = z.object({
  name: z.string().trim().min(1, "Tên nguồn API là bắt buộc.").optional(),
  baseUrl: z.string().trim().url("Base URL không hợp lệ.").optional(),
  isActive: z.boolean().optional(),
  cronEnabled: z.boolean().optional(),
  cronIntervalHours: z.number().int().min(1).optional().nullable(),
  cronMaxAccountsPerRun: z.number().int().min(1).optional().nullable(),
});

function computeNextCronRunAt(intervalHours, fromDate = new Date()) {
  const interval = Math.max(1, Number(intervalHours || 1));
  return new Date(fromDate.getTime() + interval * 60 * 60 * 1000);
}

export async function PATCH(req, { params }) {
  ensureApiSourceCronSchedulerStarted();

  try {
    const id = String(params?.id || "").trim();
    if (!id) {
      return Response.json({ success: false, message: "Nguồn API không tồn tại." }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateApiSourceSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.apiSourceConfig.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ success: false, message: "Nguồn API không tồn tại." }, { status: 404 });
    }

    const nextCronEnabled = parsed.data.cronEnabled ?? existing.cronEnabled;
    const nextCronIntervalHours = parsed.data.cronIntervalHours ?? existing.cronIntervalHours;

    const data = {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.baseUrl !== undefined ? { baseUrl: parsed.data.baseUrl.replace(/\/+$/, "") } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      ...(parsed.data.cronEnabled !== undefined ? { cronEnabled: parsed.data.cronEnabled } : {}),
      ...(parsed.data.cronIntervalHours !== undefined ? { cronIntervalHours: parsed.data.cronIntervalHours } : {}),
      ...(parsed.data.cronMaxAccountsPerRun !== undefined ? { cronMaxAccountsPerRun: parsed.data.cronMaxAccountsPerRun } : {}),
      cronStatus: nextCronEnabled ? (existing.cronStatus === "RUNNING" ? "RUNNING" : "COOLDOWN") : "DISABLED",
      nextCronRunAt:
        nextCronEnabled && nextCronIntervalHours
          ? computeNextCronRunAt(nextCronIntervalHours)
          : null,
    };

    const updated = await prisma.apiSourceConfig.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    return Response.json({ success: true, item: mapApiSource(updated) });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Không thể cập nhật nguồn API.",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const id = String(params?.id || "").trim();
    if (!id) {
      return Response.json({ success: false, message: "Nguồn API không tồn tại." }, { status: 404 });
    }

    const existing = await prisma.apiSourceConfig.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            appAccounts: true,
          },
        },
      },
    });

    if (!existing) {
      return Response.json({ success: false, message: "Nguồn API không tồn tại." }, { status: 404 });
    }

    if ((existing._count?.appAccounts || 0) > 0) {
      return Response.json(
        {
          success: false,
          blocked: true,
          message: "Nguồn API đang được sử dụng bởi App Account. Hãy gỡ liên kết hoặc tắt nguồn thay vì xóa.",
          dependencySummary: {
            appAccounts: existing._count.appAccounts,
          },
        },
        { status: 409 },
      );
    }

    await prisma.apiSourceConfig.delete({ where: { id } });
    return Response.json({ success: true, message: "Đã xóa nguồn API." });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Không thể xóa nguồn API.",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
