import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSharePageSchema = z.object({
  note: z.string().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
});

export async function GET(_req, { params }) {
  try {
    const item = await prisma.sharePage.findUnique({
      where: { id: params.id },
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
        _count: {
          select: {
            passes: true,
          },
        },
      },
    });

    if (!item) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      item,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to load share page detail",
        detail: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const body = await req.json();
    const parsed = UpdateSharePageSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const exists = await prisma.sharePage.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!exists) {
      return Response.json(
        { success: false, message: "Share page not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.sharePage.update({
      where: { id: params.id },
      data: {
        note: parsed.data.note ?? null,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      },
    });

    return Response.json({
      success: true,
      item: updated,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Failed to update share page",
        detail: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}