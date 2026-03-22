import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentAdminSession } from "@/lib/admin-session";
import {
  getSharePageDependencySummary,
  hasSharePageDependencies,
} from "@/lib/share-page-delete";

const UpdateSharePageSchema = z.object({
  note: z.string().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

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

export async function GET(_req, { params }) {
  try {
    const item = await prisma.sharePage.findUnique({
      where: { id: params.id },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            slug: true,
            packageType: true,
            description: true,
          },
        },
        _count: {
          select: {
            passes: true,
          },
        },
      },
    });

    if (!item) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      item,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to load share page detail",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdateSharePageSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const exists = await prisma.sharePage.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!exists) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.sharePage.update({
      where: { id: params.id },
      data: {
        note: parsed.data.note ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    return Response.json({
      success: true,
      item: updated,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to update share page",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return Response.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 },
    );
  }

  const sharePageId = String(params?.id || "").trim();
  if (!sharePageId) {
    return Response.json(
      { ok: false, message: "Share page not found." },
      { status: 404 },
    );
  }

  const mode = parseDeleteMode(req);
  const { reason } = await parseDeleteBody(req);

  const sharePage = await prisma.sharePage.findUnique({
    where: { id: sharePageId },
    select: {
      id: true,
      code: true,
      appId: true,
      app: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!sharePage) {
    return Response.json(
      { ok: false, message: "Share page not found." },
      { status: 404 },
    );
  }

  const dependencySummary = await getSharePageDependencySummary(sharePage.id);

  if (mode === "SAFE_DELETE" && hasSharePageDependencies(dependencySummary)) {
    await prisma.sharePageDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        appId: sharePage.appId,
        appName: sharePage.app?.name || "-",
        mode: "SAFE_DELETE",
        status: "BLOCKED",
        reason,
        dependencySummary,
      },
    });

    return Response.json(
      {
        ok: false,
        message: "Cannot delete share page because dependent records still exist.",
        mode,
        dependencySummary,
      },
      { status: 409 },
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.sharePage.delete({
        where: { id: sharePage.id },
      });

      await tx.sharePageDeleteLog.create({
        data: {
          actorUserId: session.userId,
          actorEmail: session.email,
          sharePageId: sharePage.id,
          sharePageCode: sharePage.code,
          appId: sharePage.appId,
          appName: sharePage.app?.name || "-",
          mode,
          status: "DELETED",
          reason,
          dependencySummary,
        },
      });
    });

    return Response.json({
      ok: true,
      message:
        mode === "FORCE_DELETE"
          ? "Share page and all dependent records were deleted."
          : "Share page deleted successfully.",
      mode,
      dependencySummary,
    });
  } catch (error) {
    await prisma.sharePageDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        sharePageId: sharePage.id,
        sharePageCode: sharePage.code,
        appId: sharePage.appId,
        appName: sharePage.app?.name || "-",
        mode,
        status: "FAILED",
        reason: reason || String(error?.message || "Unknown delete error"),
        dependencySummary,
      },
    });

    return Response.json(
      { ok: false, message: "Failed to delete share page." },
      { status: 500 },
    );
  }
}