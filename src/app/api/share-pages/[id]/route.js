import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentAdminSession } from "@/lib/admin-session";

const UpdateShareLinkSchema = z.object({
  apiUrl: z.string().max(2000).optional().nullable(),
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

async function getShareLinkDependencySummary(shareLinkId) {
  const [passes, shareAuthLogs] = await Promise.all([
    prisma.sharePass.count({ where: { shareLinkId } }),
    prisma.shareAuthLog.count({ where: { shareLinkId } }),
  ]);

  return {
    passes,
    shareAuthLogs,
  };
}

export async function GET(_req, { params }) {
  try {
    const item = await prisma.shareLink.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        code: true,
        apiUrl: true,
        note: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        appLabel: true,
        appDescription: true,
        _count: {
          select: {
            passes: true,
          },
        },
      },
    });

    if (!item) {
      return Response.json(
        { success: false, message: "Share link not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      item: {
        ...item,
        app: {
          id: item.id,
          name: item.appLabel,
          slug: "-",
          packageType: "-",
          description: item.appDescription ?? "",
        },
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to load share link detail",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdateShareLinkSchema.safeParse(body);

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

    const exists = await prisma.shareLink.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!exists) {
      return Response.json(
        { success: false, message: "Share link not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.shareLink.update({
      where: { id: params.id },
      data: {
        apiUrl: parsed.data.apiUrl?.trim() || null,
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
        message: "Failed to update share link",
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

  const shareLinkId = String(params?.id || "").trim();
  if (!shareLinkId) {
    return Response.json(
      { ok: false, message: "Share link not found." },
      { status: 404 },
    );
  }

  const mode = parseDeleteMode(req);
  const { reason } = await parseDeleteBody(req);

  const shareLink = await prisma.shareLink.findUnique({
    where: { id: shareLinkId },
    select: {
      id: true,
      code: true,
      appLabel: true,
      expiresAt: true,
    },
  });

  if (!shareLink) {
    return Response.json(
      { ok: false, message: "Share link not found." },
      { status: 404 },
    );
  }

  const dependencySummary = await getShareLinkDependencySummary(shareLink.id);

  try {
    if (mode === "SAFE_DELETE") {
      const now = new Date();

      await prisma.$transaction(async (tx) => {
        await tx.shareLink.update({
          where: { id: shareLink.id },
          data: {
            expiresAt: now,
          },
        });

        await tx.shareLinkDeleteLog.create({
          data: {
            actorUserId: session.userId,
            actorEmail: session.email,
            shareLinkId: shareLink.id,
            shareLinkCode: shareLink.code,
            appLabel: shareLink.appLabel,
            reason,
            status: "DELETED",
            dependencySummary: {
              mode,
              action: "SOFT_DELETE",
              ...dependencySummary,
              previousExpiresAt: shareLink.expiresAt?.toISOString() ?? null,
              appliedExpiresAt: now.toISOString(),
            },
          },
        });
      });

      return Response.json({
        ok: true,
        message: "Share link da duoc xoa mem bang cach ngung hieu luc ngay.",
        mode,
        dependencySummary,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.shareLinkDeleteLog.create({
        data: {
          actorUserId: session.userId,
          actorEmail: session.email,
          shareLinkId: shareLink.id,
          shareLinkCode: shareLink.code,
          appLabel: shareLink.appLabel,
          reason,
          status: "DELETED",
          dependencySummary: {
            mode,
            action: "HARD_DELETE",
            ...dependencySummary,
          },
        },
      });

      await tx.shareLink.delete({
        where: { id: shareLink.id },
      });
    });

    return Response.json({
      ok: true,
      message: "Share link da duoc xoa cung.",
      mode,
      dependencySummary,
    });
  } catch (error) {
    await prisma.shareLinkDeleteLog.create({
      data: {
        actorUserId: session.userId,
        actorEmail: session.email,
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        appLabel: shareLink.appLabel,
        reason: reason || String(error?.message || "Unknown delete error"),
        status: "FAILED",
        dependencySummary: {
          mode,
          action: mode === "FORCE_DELETE" ? "HARD_DELETE" : "SOFT_DELETE",
          ...dependencySummary,
        },
      },
    });

    return Response.json(
      { ok: false, message: "Failed to delete share link." },
      { status: 500 },
    );
  }
}
