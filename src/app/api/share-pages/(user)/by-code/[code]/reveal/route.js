import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyShareAccessToken } from "@/lib/share-access-token";
import {
  createExternalRawResponse,
  mapExternalAccountResponse,
} from "@/lib/share-account-response.mapper";
import {
  createShareAuthLog,
  getRemainingQuota,
  getRequestMeta,
  isShareLinkExpired,
  isSharePassExpired,
  isSharePassRevoked,
} from "@/lib/share-public";

const RevealSchema = z.object({
  verificationToken: z.string().min(1),
});

async function parseExternalApiResponse(response) {
  const contentType = response.headers.get("content-type") || null;
  let body = null;
  let bodyText = null;

  try {
    if (contentType?.includes("application/json")) {
      body = await response.json();
    } else {
      bodyText = await response.text();
      try {
        body = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        body = bodyText;
      }
    }
  } catch {
    body = null;
  }

  return createExternalRawResponse({
    ok: response.ok,
    httpStatus: response.status,
    contentType,
    body,
    bodyText,
    headers: Object.fromEntries(response.headers.entries()),
  });
}

export async function POST(req, { params }) {
  try {
    const { code } = params;
    const meta = getRequestMeta(req);

    const body = await req.json();
    const parsed = RevealSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          status: "VALIDATION_ERROR",
          message: "Validation failed",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const tokenPayload = verifyShareAccessToken(parsed.data.verificationToken);

    if (!tokenPayload || tokenPayload.code !== code) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
        { status: 401 },
      );
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { id: tokenPayload.shareLinkId },
    });
    const sharePass = await prisma.sharePass.findUnique({
      where: { id: tokenPayload.sharePassId },
    });

    if (!shareLink || !sharePass || sharePass.shareLinkId !== shareLink.id) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_INVALID",
          message: "Verification token is invalid",
        },
        { status: 401 },
      );
    }

    const tokenIssuedAt = new Date(tokenPayload.issuedAt * 1000);

    if (
      sharePass.lastRevealedAt
      && new Date(sharePass.lastRevealedAt).getTime() >= tokenIssuedAt.getTime()
    ) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "REVEAL_FAILED",
        success: false,
        message: "Verification token already consumed",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    if (isShareLinkExpired(shareLink)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "LINK_EXPIRED",
        success: false,
        message: "Reveal blocked because share link expired",
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

    if (isSharePassRevoked(sharePass)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "PASS_REVOKED",
        success: false,
        message: sharePass.reason || "Pass revoked",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "PASS_REVOKED",
          message: sharePass.reason || "This pass has been revoked",
        },
        { status: 403 },
      );
    }

    if (isSharePassExpired(sharePass)) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "PASS_EXPIRED",
        success: false,
        message: "Pass expired",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "PASS_EXPIRED",
          message: "This pass has expired",
        },
        { status: 410 },
      );
    }

    const remainingQuota = getRemainingQuota(sharePass);
    if (remainingQuota <= 0) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "QUOTA_BLOCK",
        success: false,
        message: "Quota exhausted at reveal step",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "QUOTA_EXHAUSTED",
          message: "Quota has been exhausted for this pass",
        },
        { status: 403 },
      );
    }

    if (!shareLink.apiUrl) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "REVEAL_FAILED",
        success: false,
        message: "External API URL is not configured",
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "EXTERNAL_API_NOT_CONFIGURED",
          message: "External API URL is not configured for this share link",
        },
        { status: 500 },
      );
    }

    let externalResponse;
    try {
      externalResponse = await fetch(shareLink.apiUrl, {
        method: shareLink.apiMethod || "GET",
        headers: {
          Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
          ...(shareLink.apiKey ? { Authorization: `Bearer ${shareLink.apiKey}` } : {}),
        },
        cache: "no-store",
      });
    } catch (error) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "REVEAL_FAILED",
        success: false,
        message: `External API request failed: ${String(error?.message || error)}`,
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "EXTERNAL_API_UNREACHABLE",
          message: "Failed to reach external API",
        },
        { status: 502 },
      );
    }

    const rawResponse = await parseExternalApiResponse(externalResponse);
    const mappedAccount = mapExternalAccountResponse(rawResponse);

    if (!mappedAccount.ok) {
      await createShareAuthLog(prisma, {
        shareLinkId: shareLink.id,
        shareLinkCode: shareLink.code,
        sharePassId: sharePass.id,
        sharePassLabel: sharePass.label,
        action: "REVEAL_FAILED",
        success: false,
        message: mappedAccount.message,
        ...meta,
      });

      return Response.json(
        {
          success: false,
          status: "EXTERNAL_API_ERROR",
          message: mappedAccount.message,
          meta: mappedAccount.meta,
        },
        { status: 502 },
      );
    }

    const now = new Date();
    const result = await prisma.sharePass.updateMany({
      where: {
        id: sharePass.id,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [
          {
            OR: [
              { lastRevealedAt: null },
              { lastRevealedAt: { lt: tokenIssuedAt } },
            ],
          },
        ],
        quotaUsed: {
          lt: sharePass.quotaTotal,
        },
      },
      data: {
        quotaUsed: {
          increment: 1,
        },
        lastRevealedAt: now,
      },
    });

    if (result.count !== 1) {
      return Response.json(
        {
          success: false,
          status: "TOKEN_CONSUMED",
          message: "This verification token has already been used",
        },
        { status: 409 },
      );
    }

    const updatedPass = await prisma.sharePass.findUnique({
      where: { id: sharePass.id },
    });

    await createShareAuthLog(prisma, {
      shareLinkId: shareLink.id,
      shareLinkCode: shareLink.code,
      sharePassId: sharePass.id,
      sharePassLabel: sharePass.label,
      action: "REVEAL",
      success: true,
      message: "Account info revealed successfully",
      ...meta,
    });

    return Response.json({
      success: true,
      status: "ACCESS_GRANTED",
      remainingQuota: getRemainingQuota(updatedPass || sharePass),
      item: {
        code: shareLink.code,
        note: shareLink.note,
        app: {
          id: shareLink.id,
          name: shareLink.appLabel,
          slug: "-",
          packageType: "-",
          description: shareLink.appDescription,
        },
      },
      account: mappedAccount.account,
    });
  } catch (err) {
    return Response.json(
      {
        success: false,
        status: "SERVER_ERROR",
        message: "Failed to reveal account info",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}
