import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRemainingQuota } from "@/lib/share-public";
import { getSharePassStatus } from "@/features/share-pages/lib/pass-status";
import { getCurrentAdminSession } from "@/lib/admin-session";

const UpdatePassSchema = z
  .object({
    action: z.enum(["RESET_USAGE", "REVOKE", "RESTORE", "EDIT", "ROTATE"]),
    quotaUsed: z.number().int().min(0).optional(),
    reason: z.string().max(500).optional().nullable(),
    label: z.string().max(120).optional().nullable(),
    quotaTotal: z.number().int().min(1).optional(),
    expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
    newPass: z.string().min(1).max(128).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === "RESET_USAGE" && typeof data.quotaUsed !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quotaUsed"],
        message: "quotaUsed is required for RESET_USAGE",
      });
    }

    if (data.action === "EDIT" && typeof data.quotaTotal !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["quotaTotal"],
        message: "quotaTotal is required for EDIT",
      });
    }

    if (data.action === "ROTATE" && !data.newPass) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPass"],
        message: "newPass is required for ROTATE",
      });
    }
  });

function mapPassResponse(pass) {
  return {
    id: pass.id,
    label: pass.label,
    quotaTotal: pass.quotaTotal,
    quotaUsed: pass.quotaUsed,
    quotaRemaining: getRemainingQuota(pass),
    revokedAt: pass.revokedAt,
    reason: pass.reason,
    expiresAt: pass.expiresAt,
    lastVerifiedAt: pass.lastVerifiedAt,
    lastRevealedAt: pass.lastRevealedAt,
    createdAt: pass.createdAt,
    updatedAt: pass.updatedAt,
    status: getSharePassStatus(pass),
  };
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

async function getSharePassDependencySummary(sharePassId) {
  const shareAuthLogs = await prisma.shareAuthLog.count({
    where: { sharePassId },
  });

  return {
    shareAuthLogs,
  };
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdatePassSchema.safeParse(body);

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

    const current = await prisma.sharePass.findFirst({
      where: {
        id: params.passId,
        shareLinkId: params.id,
      },
    });

    if (!current) {
      return Response.json(
        {
          success: false,
          message: "Pass not found",
        },
        { status: 404 },
      );
    }

    const {
      action,
      quotaUsed,
      reason,
      label,
      quotaTotal,
      expiresAt,
      newPass,
    } = parsed.data;

    let data;
    let message;

    if (action === "RESET_USAGE") {
      data = {
        quotaUsed: Math.min(quotaUsed, current.quotaTotal),
      };
      message = "Pass usage updated successfully";
    } else if (action === "EDIT") {
      data = {
        label: label?.trim() || null,
        quotaTotal: Math.max(quotaTotal, 1),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        quotaUsed: Math.min(current.quotaUsed, Math.max(quotaTotal, 1)),
      };
      message = "Pass updated successfully";
    } else if (action === "ROTATE") {
      const bcrypt = await import("bcryptjs");
      const nextHash = await bcrypt.hash(newPass, 10);

      data = {
        passwordHash: nextHash,
        revokedAt: null,
        reason: null,
      };
      message = "Pass rotated successfully";
    } else if (action === "REVOKE") {
      data = {
        revokedAt: new Date(),
        reason: reason?.trim() || "ADMIN_REVOKED",
      };
      message = "Pass revoked successfully";
    } else {
      data = {
        revokedAt: null,
        reason: null,
      };
      message = "Pass restored successfully";
    }

    const updated = await prisma.sharePass.update({
      where: { id: current.id },
      data,
    });

    return Response.json({
      success: true,
      message,
      item: mapPassResponse(updated),
      rotatedPass: action === "ROTATE" ? newPass : null,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to update pass",
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
  const sharePassId = String(params?.passId || "").trim();

  if (!shareLinkId || !sharePassId) {
    return Response.json(
      { ok: false, message: "Pass not found." },
      { status: 404 },
    );
  }

  const mode = parseDeleteMode(req);
  const { reason } = await parseDeleteBody(req);

  const sharePass = await prisma.sharePass.findFirst({
    where: {
      id: sharePassId,
      shareLinkId,
    },
    select: {
      id: true,
      label: true,
      shareLinkId: true,
      quotaTotal: true,
      quotaUsed: true,
      revokedAt: true,
      reason: true,
      shareLink: {
        select: {
          code: true,
          appLabel: true,
        },
      },
    },
  });

  if (!sharePass) {
    return Response.json(
      { ok: false, message: "Pass not found." },
      { status: 404 },
    );
  }

  const dependencySummary = await getSharePassDependencySummary(sharePass.id);

  try {
    if (mode === "SAFE_DELETE") {
      await prisma.sharePass.update({
        where: { id: sharePass.id },
        data: {
          revokedAt: sharePass.revokedAt || new Date(),
          reason: reason || sharePass.reason || "ADMIN_SOFT_DELETE",
        },
      });

      await prisma.shareAuthLog.create({
        data: {
          shareLinkId: sharePass.shareLinkId,
          shareLinkCode: sharePass.shareLink?.code || null,
          sharePassId: sharePass.id,
          sharePassLabel: sharePass.label,
          action: "PASS_SOFT_DELETE",
          success: true,
          message: reason || "Pass revoked by admin as soft delete",
          ipAddress: null,
          userAgent: `admin:${session.email}`,
        },
      });

      return Response.json({
        ok: true,
        message: "Pass đã được xóa mềm bằng cách thu hồi quyền truy cập.",
        mode,
        dependencySummary,
      });
    }

    await prisma.shareAuthLog.create({
      data: {
        shareLinkId: sharePass.shareLinkId,
        shareLinkCode: sharePass.shareLink?.code || null,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "PASS_HARD_DELETE",
        success: true,
        message: reason || "Pass deleted permanently by admin",
        ipAddress: null,
        userAgent: `admin:${session.email}`,
      },
    });

    await prisma.sharePass.delete({
      where: { id: sharePass.id },
    });

    return Response.json({
      ok: true,
      message: "Pass đã được xóa cứng.",
      mode,
      dependencySummary,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        message: "Failed to delete pass.",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
