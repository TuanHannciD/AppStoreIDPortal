import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const CreatePassSchema = z.object({
  pass: z.string().min(1).max(128),
  quota: z.number().int().min(1),
  label: z.string().max(120).optional().nullable(),
});

export async function GET(_req, { params }) {
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
        // isActive: true, trong db không có
        //lastUsedAt: true, trong db không có
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const items = passes.map((pass) => ({
      ...pass,
      quotaRemaining: Math.max(0, pass.quotaTotal - (pass.quotaUsed ?? 0)),
    }));

    return Response.json({
      success: true,
      sharePage: {
        id: sharePage.id,
        code: sharePage.code,
        note: sharePage.note,
        expiresAt: sharePage.expiresAt,
        app: sharePage.app,
      },
      items,
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
        passHash,
        label: parsed.data.label ?? null,
        quotaTotal: parsed.data.quota,
        quotaRemaining: parsed.data.quota,
        isActive: true,
      },
      select: {
        id: true,
        label: true,
        quotaTotal: true,
        quotaRemaining: true,
        isActive: true,
        lastUsedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({
      success: true,
      item: created,
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
