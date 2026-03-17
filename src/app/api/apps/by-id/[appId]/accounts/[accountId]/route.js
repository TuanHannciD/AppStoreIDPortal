import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Route thao tác trên một AppAccount cụ thể.
 *
 * Nhiệm vụ:
 * - `PATCH`: sửa nội dung account hoặc toggle active
 * - `DELETE`: xóa account sau khi check các case an toàn
 *
 * Với delete, mục tiêu không phải là "cứ có nút là xóa được".
 * Server cần check trước các case business để tránh:
 * - xóa account đang được gắn vào share page
 * - làm share page mất account mà admin không biết
 *
 * Nghĩa là:
 * - UI vẫn cho bấm Delete
 * - nhưng quyền quyết định cuối cùng nằm ở server
 * - nếu không qua case check, server trả message rõ ràng để UI hiển thị lại
 */

const UpdateAppAccountSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  username: z.string().max(200).optional().nullable(),
  password: z.string().max(500).optional().nullable(),
  twoFaKey: z.string().max(500).optional().nullable(),
  backupCode: z.string().max(2000).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

function mapAppAccount(item) {
  return {
    id: item.id,
    appId: item.appId,
    title: item.title,
    email: item.email,
    username: item.username,
    password: item.password,
    twoFaKey: item.twoFaKey,
    backupCode: item.backupCode,
    note: item.note,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdateAppAccountSchema.safeParse(body);

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

    const existing = await prisma.appAccount.findFirst({
      where: {
        id: params.accountId,
        appId: params.appId,
      },
    });

    if (!existing) {
      return Response.json(
        { success: false, message: "App account not found" },
        { status: 404 },
      );
    }

    const updated = await prisma.appAccount.update({
      where: { id: existing.id },
      data: {
        title: parsed.data.title?.trim() || null,
        email: parsed.data.email?.trim() || null,
        username: parsed.data.username?.trim() || null,
        password: parsed.data.password?.trim() || null,
        twoFaKey: parsed.data.twoFaKey?.trim() || null,
        backupCode: parsed.data.backupCode?.trim() || null,
        note: parsed.data.note?.trim() || null,
        isActive: parsed.data.isActive ?? existing.isActive,
      },
    });

    return Response.json({
      success: true,
      item: mapAppAccount(updated),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to update app account",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    /**
     * Bước 1:
     * Kiểm tra account có tồn tại và thuộc đúng app đang thao tác không.
     */
    const existing = await prisma.appAccount.findFirst({
      where: {
        id: params.accountId,
        appId: params.appId,
      },
      include: {
        sharePageAccounts: {
          include: {
            sharePage: {
              select: {
                id: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return Response.json(
        { success: false, message: "App account not found" },
        { status: 404 },
      );
    }

    /**
     * Bước 2:
     * Check case business quan trọng nhất:
     * account còn đang được gắn với share page nào không.
     *
     * Nếu còn mapping, KHÔNG cho xóa.
     * Lý do:
     * - schema hiện tại đang cascade delete mapping
     * - điều đó có thể làm share page mất account đang dùng thật
     * - admin nên chủ động gỡ khỏi share page trước rồi mới xóa hẳn
     */
    if (existing.sharePageAccounts.length > 0) {
      const linkedCodes = existing.sharePageAccounts
        .map((item) => item.sharePage?.code)
        .filter(Boolean);

      const previewCodes = linkedCodes.slice(0, 5).join(", ");
      const suffix =
        linkedCodes.length > 5
          ? ` and ${linkedCodes.length - 5} more`
          : "";

      return Response.json(
        {
          success: false,
          message:
            linkedCodes.length > 0
              ? `Cannot delete this account because it is still assigned to ${linkedCodes.length} share page(s): ${previewCodes}${suffix}. Remove it from those share pages first.`
              : "Cannot delete this account because it is still assigned to one or more share pages.",
        },
        { status: 409 },
      );
    }

    /**
     * Bước 3:
     * Chỉ khi account không còn bị gắn vào share page nào
     * thì mới thực hiện delete thật.
     */
    await prisma.appAccount.delete({
      where: { id: existing.id },
    });

    return Response.json({
      success: true,
      message: "App account deleted successfully",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to delete app account",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
