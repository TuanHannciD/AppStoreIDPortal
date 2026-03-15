import { prisma } from "@/lib/prisma";
import {
  createShareAuthLog,
  getRequestMeta,
  isSharePageExpired,
} from "@/lib/share-public";

/**
 * GET /api/share-pages/by-code/[code]
 *
 * Mục đích:
 * - Dùng cho public page khi user mở link share
 * - Chỉ trả metadata public tối thiểu
 * - Chưa verify pass
 * - Chưa trừ quota
 */
export async function GET(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const sharePage = await prisma.sharePage.findUnique({
      where: { code },
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
      },
    });

    // Link không tồn tại
    if (!sharePage) {
      return Response.json(
        {
          success: false,
          status: "NOT_FOUND",
          message: "Share link not found",
        },
        { status: 404 },
      );
    }

    // Link hết hạn
    if (isSharePageExpired(sharePage)) {
      await createShareAuthLog(prisma, {
        sharePageId: sharePage.id,
        action: "LINK_EXPIRED",
        success: false,
        message: "Share link expired",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "LINK_EXPIRED",
          message: "This share link has expired",
        },
        { status: 410 },
      );
    }

    // Có thể log trạng thái link sẵn sàng nếu bạn muốn audit nhẹ
    await createShareAuthLog(prisma, {
      sharePageId: sharePage.id,
      action: "LINK_READY",
      success: true,
      message: "Public metadata loaded",
      ...meta,
    });

    return Response.json({
      success: true,
      status: "READY",
      item: {
        code: sharePage.code,
        note: sharePage.note,
        expiresAt: sharePage.expiresAt,
        consumeOnVerify: sharePage.consumeOnVerify,
        app: {
          id: sharePage.app.id,
          name: sharePage.app.name,
          slug: sharePage.app.slug,
          packageType: sharePage.app.packageType,
          description: sharePage.app.description,
        },
      },
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message: "Failed to load share link",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
