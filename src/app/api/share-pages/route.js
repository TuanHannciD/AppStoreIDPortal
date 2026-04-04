import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { parsePassFileContent } from "@/features/share-pages/lib/passBulk";
import { getCurrentAdminSession } from "@/lib/admin-session";

function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

const CreateShareLinkSchema = z.object({
  appLabel: z.string().trim().min(1).max(160),
  appDescription: z.string().max(2000).optional().nullable(),
  note: z.string().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  code: z.string().max(64).optional().nullable(),
  apiUrl: z.string().max(2000).optional().nullable(),
  rateEnabled: z.boolean().optional(),
  rateWindowSec: z.number().int().min(1).optional(),
  rateMaxRequests: z.number().int().min(1).optional(),
  consumeOnVerify: z.boolean().optional(),
  passes: z
    .array(
      z.object({
        pass: z.string().min(1).max(128),
        quota: z.number().int().min(1),
        label: z.string().max(120).optional().nullable(),
      }),
    )
    .min(1),
});

export async function GET() {
  try {
    const items = await prisma.shareLink.findMany({
      include: {
        _count: {
          select: {
            passes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({
      success: true,
      items,
    });
  } catch (err) {
    return Response.json(
      {
      success: false,
      message: "Failed to load share links",
      detail: String(err?.message || err),
    },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const session = await getCurrentAdminSession();
    const body = await req.json();
    const parsed = CreateShareLinkSchema.safeParse(body);

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

    const {
      appLabel,
      appDescription,
      note,
      expiresAt,
      code,
      apiUrl,
      rateEnabled,
      rateWindowSec,
      rateMaxRequests,
      consumeOnVerify,
      passes,
    } = parsed.data;

    const passValidation = parsePassFileContent(
      passes.map((item) => `${item.pass}|${item.quota}|${item.label || ""}`).join("\n"),
    );

    if (!passValidation.ok) {
      return Response.json(
        {
          success: false,
          message: passValidation.message,
        },
        { status: 400 },
      );
    }

    let finalCode = (code && code.trim()) || genCode(8);

    for (let i = 0; i < 5; i++) {
      const exists = await prisma.shareLink.findUnique({
        where: { code: finalCode },
      });
      if (!exists) break;
      finalCode = genCode(8);
    }

    const shareLink = await prisma.$transaction(async (tx) => {
      const created = await tx.shareLink.create({
        data: {
          code: finalCode,
          appLabel: appLabel.trim(),
          appDescription: appDescription?.trim() || null,
          apiUrl: apiUrl?.trim() || null,
          apiMethod: "GET",
          note: note?.trim() || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          rateEnabled: rateEnabled ?? true,
          rateWindowSec: rateWindowSec ?? 60,
          rateMaxRequests: rateMaxRequests ?? 30,
          consumeOnVerify: consumeOnVerify ?? false,
          ownerId: session?.userId || null,
        },
      });

      for (const item of passes) {
        const passwordHash = await bcrypt.hash(item.pass, 10);

        await tx.sharePass.create({
          data: {
            shareLinkId: created.id,
            passwordHash,
            label: item.label ?? null,
            quotaTotal: item.quota,
            quotaUsed: 0,
          },
        });
      }

      return created;
    });

    const origin = req.headers.get("origin") || "";
    const url = origin
      ? `${origin}/share/${shareLink.code}`
      : `/share/${shareLink.code}`;

    return Response.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        code: shareLink.code,
        appLabel: shareLink.appLabel,
        appDescription: shareLink.appDescription,
        note: shareLink.note,
        expiresAt: shareLink.expiresAt,
        consumeOnVerify: shareLink.consumeOnVerify,
      },
      url,
      passesCreated: passes.length,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        message: "Server error",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
