import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  getRemainingQuota,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";
import { getSharePassStatus } from "@/features/share-pages/lib/pass-status";
import { parsePassFileContent } from "@/features/share-pages/lib/passBulk";

const CreatePassItemSchema = z.object({
  pass: z.string().min(1).max(128),
  quota: z.coerce.number().int().min(1),
  label: z.string().max(120).optional().nullable(),
});

const CreatePassBatchSchema = z.object({
  passes: z.array(CreatePassItemSchema).min(1),
});

function mapPassItem(pass) {
  return {
    ...pass,
    quotaRemaining: getRemainingQuota(pass),
    isRevoked: isSharePassRevoked(pass),
    isExpired: isSharePassExpired(pass),
    status: getSharePassStatus(pass),
  };
}

function normalizeCreatePayload(body) {
  if (Array.isArray(body?.passes)) {
    return body;
  }

  return {
    passes: [body],
  };
}

export async function GET(_req, { params }) {
  try {
    const shareLink = await prisma.shareLink.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        code: true,
        note: true,
        expiresAt: true,
        appLabel: true,
        appDescription: true,
      },
    });

    if (!shareLink) {
      return Response.json(
        { success: false, message: "Share link not found" },
        { status: 404 },
      );
    }

    const passes = await prisma.sharePass.findMany({
      where: { shareLinkId: params.id },
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
      shareLink: {
        id: shareLink.id,
        code: shareLink.code,
        note: shareLink.note,
        expiresAt: shareLink.expiresAt,
        app: {
          name: shareLink.appLabel,
          slug: "-",
          description: shareLink.appDescription ?? null,
        },
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
  try {
    const body = await req.json();
    const parsed = CreatePassBatchSchema.safeParse(normalizeCreatePayload(body));

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

    const passValidation = parsePassFileContent(
      parsed.data.passes
        .map((item) => `${item.pass}|${item.quota}|${item.label || ""}`)
        .join("\n"),
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

    const shareLink = await prisma.shareLink.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!shareLink) {
      return Response.json(
        { success: false, message: "Share link not found" },
        { status: 404 },
      );
    }

    const createdItems = await prisma.$transaction(async (tx) => {
      const nextItems = [];

      for (const item of parsed.data.passes) {
        const passwordHash = await bcrypt.hash(item.pass, 10);

        const created = await tx.sharePass.create({
          data: {
            shareLinkId: params.id,
            passwordHash,
            label: item.label ?? null,
            quotaTotal: item.quota,
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

        nextItems.push(created);
      }

      return nextItems;
    });

    const items = createdItems.map(mapPassItem);

    return Response.json({
      success: true,
      item: items[0] ?? null,
      items,
      createdCount: items.length,
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
