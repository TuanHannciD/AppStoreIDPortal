import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";
import { getAppDependencySummary, hasAppDependencies } from "@/lib/app-delete";

const updateAppSchema = z.object({
  name: z.string().trim().min(1, "Tên app là bắt buộc."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug là bắt buộc.")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."),
  packageType: z.string().trim().min(1, "Loại gói là bắt buộc."),
  description: z.string().trim().nullable().optional(),
});

function buildUnauthorizedResponse() {
  return NextResponse.json(
    { ok: false, message: "Unauthorized." },
    { status: 401 },
  );
}

function buildNotFoundResponse() {
  return NextResponse.json(
    { ok: false, message: "App not found." },
    { status: 404 },
  );
}

function parseDeleteMode(req) {
  const forceValue = req.nextUrl.searchParams.get("force");
  return forceValue === "1" || forceValue === "true"
    ? "FORCE_DELETE"
    : "SAFE_DELETE";
}

async function parseDeleteBody(req) {
  try {
    const body = await req.json();
    return {
      reason: String(body?.reason || "").trim() || null,
    };
  } catch {
    return { reason: null };
  }
}

export async function DELETE(req, { params }) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return buildUnauthorizedResponse();
  }

  const appId = String(params?.appId || "").trim();
  if (!appId) {
    return buildNotFoundResponse();
  }

  const mode = parseDeleteMode(req);
  const { reason } = await parseDeleteBody(req);

  const app = await prisma.app.findUnique({
    where: { id: appId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (!app) {
    return buildNotFoundResponse();
  }

  const dependencySummary = await getAppDependencySummary(app.id);

  if (mode === "SAFE_DELETE" && hasAppDependencies(dependencySummary)) {
    await prisma.appDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        mode: "SAFE_DELETE",
        status: "BLOCKED",
        reason,
        dependencySummary,
      },
    });

    return NextResponse.json(
      {
        ok: false,
        message: "Cannot delete app because dependent records still exist.",
        mode,
        dependencySummary,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.app.delete({
        where: { id: app.id },
      });

      await tx.appDeleteLog.create({
        data: {
          actorUserId: session.userId,
          actorEmail: session.email,
          appId: app.id,
          appName: app.name,
          appSlug: app.slug,
          mode,
          status: "DELETED",
          reason,
          dependencySummary,
        },
      });
    });

    return NextResponse.json({
      ok: true,
      message:
        mode === "FORCE_DELETE"
          ? "App and all dependent records were deleted."
          : "App deleted successfully.",
      mode,
      dependencySummary,
    });
  } catch (error) {
    console.error("delete_app_failed", error);

    await prisma.appDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        appId: app.id,
        appName: app.name,
        appSlug: app.slug,
        mode,
        status: "FAILED",
        reason: reason || String(error?.message || "Unknown delete error"),
        dependencySummary,
      },
    });

    return NextResponse.json(
      { ok: false, message: "Failed to delete app." },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return buildUnauthorizedResponse();
  }

  const appId = String(params?.appId || "").trim();
  if (!appId) {
    return buildNotFoundResponse();
  }

  try {
    const raw = await req.json();
    const parsed = updateAppSchema.safeParse({
      ...raw,
      description: raw?.description?.trim() ? raw.description.trim() : null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    const exists = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true },
    });

    if (!exists) {
      return buildNotFoundResponse();
    }

    const item = await prisma.app.update({
      where: { id: appId },
      data: parsed.data,
      select: {
        id: true,
        slug: true,
        name: true,
        packageType: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { ok: false, message: "Slug đã tồn tại. Hãy chọn slug khác." },
        { status: 409 },
      );
    }

    console.error("update_app_failed", error);
    return NextResponse.json(
      { ok: false, message: "Không thể cập nhật app." },
      { status: 500 },
    );
  }
}
