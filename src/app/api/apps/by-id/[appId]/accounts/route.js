import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Route CRUD gốc cho AppAccount theo từng app.
 *
 * Nhiệm vụ:
 * - `GET`: lấy danh sách account của app để list/admin screen dùng
 * - `POST`: tạo account mới cho app
 *
 * Lý do tách theo `appId`:
 * - AppAccount luôn thuộc về một App cụ thể
 * - UI quản trị có thể filter theo app rất rõ ràng
 */

const CreateAppAccountSchema = z.object({
  title: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  username: z.string().max(200).optional().nullable(),
  password: z.string().max(500).optional().nullable(),
  twoFaKey: z.string().max(500).optional().nullable(),
  backupCode: z.string().max(2000).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  apiSourceConfigId: z.string().max(191).optional().nullable(),
  externalKey: z.string().max(200).optional().nullable(),
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
    apiSourceConfigId: item.apiSourceConfigId,
    externalKey: item.externalKey,
    lastSyncedAt: item.lastSyncedAt,
    lastSyncStatus: item.lastSyncStatus,
    lastSyncResultCode: item.lastSyncResultCode,
    lastSyncResultMessage: item.lastSyncResultMessage,
    lastSyncError: item.lastSyncError,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

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
    });

    return Response.json({
      success: true,
      app,
      accounts: accounts.map(mapAppAccount),
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

export async function POST(req, { params }) {
  try {
    const appId = params?.appId;

    if (!appId) {
      return Response.json(
        { success: false, message: "appId is required" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const parsed = CreateAppAccountSchema.safeParse(body);

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

    const app = await prisma.app.findUnique({
      where: { id: appId },
      select: { id: true },
    });

    if (!app) {
      return Response.json(
        { success: false, message: "App not found" },
        { status: 404 },
      );
    }

    const created = await prisma.appAccount.create({
      data: {
        appId,
        title: parsed.data.title?.trim() || null,
        email: parsed.data.email?.trim() || null,
        username: parsed.data.username?.trim() || null,
        password: parsed.data.password?.trim() || null,
        twoFaKey: parsed.data.twoFaKey?.trim() || null,
        backupCode: parsed.data.backupCode?.trim() || null,
        note: parsed.data.note?.trim() || null,
        isActive: parsed.data.isActive ?? true,
        apiSourceConfigId: parsed.data.apiSourceConfigId?.trim() || null,
        externalKey: parsed.data.externalKey?.trim() || null,
      },
    });

    return Response.json({
      success: true,
      item: mapAppAccount(created),
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Failed to create app account",
        detail: String(error?.message || error),
      },
      { status: 500 },
    );
  }
}
