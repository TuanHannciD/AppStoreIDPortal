import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getRemainingQuota,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";
import { getSharePassStatus } from "@/features/share-pages/lib/pass-status";

/**
 * File API này xử lý danh sách pass của một share page.
 *
 * Vai trò:
 * - `GET`: trả danh sách pass để admin hiển thị trong Manage Passes
 * - `POST`: tạo pass mới cho share page
 *
 * Đây là route ở tầng "admin management", khác với các route public
 * `verify` / `reveal` dùng cho người dùng cuối.
 */

const CreatePassSchema = z.object({
  pass: z.string().min(1).max(128),
  quota: z.number().int().min(1),
  label: z.string().max(120).optional().nullable(),
});

/**
 * Convert raw SharePass row thành shape dễ dùng ở bảng admin.
 * Mình giữ mapping này ở server để client không phải tự đoán status.
 */
function mapPassItem(pass) {
  return {
    ...pass,
    quotaRemaining: getRemainingQuota(pass),
    isRevoked: isSharePassRevoked(pass),
    isExpired: isSharePassExpired(pass),
    status: getSharePassStatus(pass),
  };
}

export async function GET(_req, { params }) {
  /**
   * Lấy toàn bộ pass của một share page để render ở admin.
   *
   * Ở đây server trả luôn:
   * - quotaRemaining
   * - status
   * - revoked/expired flags
   *
   * để client chỉ việc hiển thị.
   */
  try {
    const sharePage = await prisma.sharePage.findUnique({
      where: { id: params.id },
      include: {
        app: {
          select: {
            id: true,
            name: true,
            slug: true,
            packageType: true,
          },
        },
      },
    });

    if (!sharePage) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    const passes = await prisma.sharePass.findMany({
      where: { sharePageId: params.id },
      select: {
        id: true,
        label: true,
        quotaTotal: true,
        quotaUsed: true,
        revokedAt: true,
        reason: true,
        expiresAt: true,
        lastVerifiedAt: true,
        lastRevealedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      sharePage: {
        id: sharePage.id,
        code: sharePage.code,
        note: sharePage.note,
        expiresAt: sharePage.expiresAt,
        app: sharePage.app,
      },
      items: passes.map(mapPassItem),
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to load passes",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  /**
   * Tạo một pass mới.
   *
   * Flow:
   * 1. validate payload
   * 2. kiểm tra share page có tồn tại không
   * 3. hash plaintext pass
   * 4. lưu DB
   * 5. trả item đã được map sẵn cho UI
   *
   * Lưu ý:
   * - không lưu plaintext pass vào DB
   * - chỉ lưu `passwordHash`
   */
  try {
    const body = await req.json();
    const parsed = CreatePassSchema.safeParse(body);

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

    const sharePage = await prisma.sharePage.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!sharePage) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    const passHash = await bcrypt.hash(parsed.data.pass, 10);

    const created = await prisma.sharePass.create({
      data: {
        sharePageId: params.id,
        passwordHash: passHash,
        label: parsed.data.label ?? null,
        quotaTotal: parsed.data.quota,
      },
      select: {
        id: true,
        label: true,
        quotaTotal: true,
        quotaUsed: true,
        revokedAt: true,
        reason: true,
        expiresAt: true,
        lastVerifiedAt: true,
        lastRevealedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({
      success: true,
      item: mapPassItem(created),
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to create pass",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
