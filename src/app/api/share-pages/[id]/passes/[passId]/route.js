import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRemainingQuota } from "@/lib/share-public";
import { getSharePassStatus } from "@/features/share-pages/lib/pass-status";

/**
 * File API này xử lý các action admin trên MỘT pass cụ thể.
 *
 * Ở Phase 1 mình gom các action nhẹ vào chung một route PATCH:
 * - RESET_USAGE
 * - REVOKE
 * - RESTORE
 * - EDIT
 * - ROTATE
 *
 * Lý do gom chung:
 * - phía UI đơn giản hơn
 * - dễ giải thích flow cho người mới đọc code
 * - sau này nếu action phức tạp hơn vẫn có thể tách route riêng
 */

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
  /**
   * Chuẩn hóa response trả về cho client sau khi update.
   *
   * Nhờ đó UI có thể thay thế trực tiếp row cũ bằng row mới
   * mà không cần transform lại lần nữa.
   */
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

export async function PATCH(req, { params }) {
  /**
   * Endpoint update một pass.
   *
   * Trách nhiệm:
   * 1. validate body
   * 2. kiểm tra pass có thuộc sharePage hiện tại không
   * 3. phân nhánh theo `action`
   * 4. update DB
   * 5. trả row mới về cho UI
   */
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
        sharePageId: params.id,
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

    const { action, quotaUsed, reason, label, quotaTotal, expiresAt, newPass } = parsed.data;

    /**
     * `data`
     * Là payload cuối cùng sẽ được truyền vào Prisma `update`.
     *
     * `message`
     * Là thông báo success để UI hiển thị toast.
     */
    let data;
    let message;

    // Phase 1 gom vào một endpoint để UI và tài liệu dễ theo dõi.
    // Sau này nếu action nhiều hơn, mình có thể tách thành các route nhỏ hơn.
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
        // Nếu admin giảm quotaTotal xuống nhỏ hơn quotaUsed hiện tại,
        // mình kẹp quotaUsed lại để dữ liệu không rơi vào trạng thái vô lý.
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
