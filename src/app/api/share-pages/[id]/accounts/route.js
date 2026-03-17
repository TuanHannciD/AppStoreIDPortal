import { z } from "zod";
import { prisma } from "@/lib/prisma";

/**
 * API này phục vụ riêng cho phần quản lý account của một share page.
 *
 * Mục tiêu:
 * - `GET`: lấy cả danh sách account đang được gắn và pool account khả dụng của app
 * - `PATCH`: thực hiện các action quản trị như add/remove/toggle/move
 *
 * Tách riêng route này giúp flow account độc lập với flow pass,
 * dễ đọc và dễ mở rộng hơn sau này.
 */

const AccountActionSchema = z.object({
  action: z.enum(["ADD", "REMOVE", "TOGGLE_ACTIVE", "MOVE_UP", "MOVE_DOWN"]),
  appAccountId: z.string().min(1),
});

function mapAssignedAccount(item) {
  return {
    id: item.id,
    sharePageId: item.sharePageId,
    appAccountId: item.appAccountId,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    account: {
      id: item.appAccount.id,
      title: item.appAccount.title,
      email: item.appAccount.email,
      username: item.appAccount.username,
      note: item.appAccount.note,
      isActive: item.appAccount.isActive,
    },
  };
}

async function loadAccountPayload(sharePageId) {
  const sharePage = await prisma.sharePage.findUnique({
    where: { id: sharePageId },
    include: {
      app: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      sharePageAccounts: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          appAccount: {
            select: {
              id: true,
              title: true,
              email: true,
              username: true,
              note: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!sharePage) {
    return null;
  }

  const availableAccounts = await prisma.appAccount.findMany({
    where: { appId: sharePage.appId },
    select: {
      id: true,
      title: true,
      email: true,
      username: true,
      note: true,
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    sharePage: {
      id: sharePage.id,
      code: sharePage.code,
      app: sharePage.app,
    },
    assignedAccounts: sharePage.sharePageAccounts.map(mapAssignedAccount),
    availableAccounts,
  };
}

export async function GET(_req, { params }) {
  try {
    const payload = await loadAccountPayload(params.id);

    if (!payload) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    return Response.json({
      success: true,
      ...payload,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to load share page accounts",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = AccountActionSchema.safeParse(body);

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
      select: {
        id: true,
        appId: true,
      },
    });

    if (!sharePage) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 },
      );
    }

    const { action, appAccountId } = parsed.data;

    const account = await prisma.appAccount.findFirst({
      where: {
        id: appAccountId,
        appId: sharePage.appId,
      },
      select: { id: true },
    });

    if (!account) {
      return Response.json(
        { success: false, message: "Account does not belong to this app" },
        { status: 404 },
      );
    }

    const current = await prisma.sharePageAccount.findUnique({
      where: {
        sharePageId_appAccountId: {
          sharePageId: sharePage.id,
          appAccountId,
        },
      },
    });

    if (action === "ADD") {
      if (current) {
        return Response.json({
          success: true,
          message: "Account already assigned",
          ...(await loadAccountPayload(params.id)),
        });
      }

      const lastItem = await prisma.sharePageAccount.findFirst({
        where: { sharePageId: sharePage.id },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });

      await prisma.sharePageAccount.create({
        data: {
          sharePageId: sharePage.id,
          appAccountId,
          isActive: true,
          sortOrder: (lastItem?.sortOrder ?? -1) + 1,
        },
      });
    } else {
      if (!current) {
        return Response.json(
          { success: false, message: "Assigned account not found" },
          { status: 404 },
        );
      }

      if (action === "REMOVE") {
        await prisma.sharePageAccount.delete({
          where: { id: current.id },
        });
      }

      if (action === "TOGGLE_ACTIVE") {
        await prisma.sharePageAccount.update({
          where: { id: current.id },
          data: {
            isActive: !current.isActive,
          },
        });
      }

      if (action === "MOVE_UP" || action === "MOVE_DOWN") {
        const direction = action === "MOVE_UP" ? -1 : 1;

        const ordered = await prisma.sharePageAccount.findMany({
          where: { sharePageId: sharePage.id },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            appAccountId: true,
            sortOrder: true,
          },
        });

        const index = ordered.findIndex((item) => item.appAccountId === appAccountId);
        const targetIndex = index + direction;

        if (index >= 0 && targetIndex >= 0 && targetIndex < ordered.length) {
          const currentItem = ordered[index];
          const targetItem = ordered[targetIndex];

          await prisma.$transaction([
            prisma.sharePageAccount.update({
              where: { id: currentItem.id },
              data: { sortOrder: targetItem.sortOrder },
            }),
            prisma.sharePageAccount.update({
              where: { id: targetItem.id },
              data: { sortOrder: currentItem.sortOrder },
            }),
          ]);
        }
      }
    }

    return Response.json({
      success: true,
      message: "Account action completed",
      ...(await loadAccountPayload(params.id)),
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to update share page account",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
