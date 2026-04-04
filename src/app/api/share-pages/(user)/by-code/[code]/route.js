import { prisma } from "@/lib/prisma";
import {
  createShareAuthLog,
  getRequestMeta,
  isShareLinkExpired,
} from "@/lib/share-public";

export async function GET(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const shareLink = await prisma.shareLink.findUnique({
      where: { code },
    });

    if (!shareLink) {
      return Response.json(
        {
          success: false,
          status: "NOT_FOUND",
          message: "Share link not found",
        },
        { status: 404 },
      );
    }

    if (isShareLinkExpired(shareLink)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
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

    await createShareAuthLog(prisma, {
      shareLinkId: shareLink.id,
      shareLinkCode: shareLink.code,
      action: "LINK_READY",
      success: true,
      message: "Public metadata loaded",
      ...meta,
    });

    return Response.json({
      success: true,
      status: "READY",
      item: {
        code: shareLink.code,
        note: shareLink.note,
        expiresAt: shareLink.expiresAt,
        consumeOnVerify: shareLink.consumeOnVerify,
        app: {
          id: shareLink.id,
          name: shareLink.appLabel,
          slug: "-",
          packageType: "-",
          description: shareLink.appDescription,
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
