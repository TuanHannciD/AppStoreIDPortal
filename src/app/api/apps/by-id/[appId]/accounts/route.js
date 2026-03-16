import { prisma } from "@/lib/prisma";

/**
 * GET /api/apps/by-id/[appId]/accounts
 *
 * Dùng để lấy danh sách AppAccount theo appId
 * cho form tạo / sửa SharePage trong admin.
 */
export async function GET(_req, { params }) {
  try {
    const appId = params?.appId;

    if (!appId) {
      return Response.json(
        {
          success: false,
          message: "appId is required",
        },
        { status: 400 },
      );
    }

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!app) {
      return Response.json(
        {
          success: false,
          message: "App not found",
        },
        { status: 404 },
      );
    }

    const accounts = await prisma.appAccount.findMany({
      where: { appId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        username: true,
        note: true,
        isActive: true,
        createdAt: true,
      },
    });

    return Response.json({
      success: true,
      app,
      accounts,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to load app accounts",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
