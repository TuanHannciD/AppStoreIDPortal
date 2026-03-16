import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

function genCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

const CreateSharePageSchema = z.object({
  appId: z.string().min(1),
  note: z.string().max(2000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  code: z.string().max(64).optional().nullable(),

  // CHANGED:
  // Flow mới cần lưu policy trừ quota vào SharePage.
  // false = verify không trừ quota, reveal mới trừ
  // true  = verify pass là trừ quota ngay
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
  /**
   * Field mới:
   * Danh sách account được gắn vào SharePage.
   */
  accountIds: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  try {
    const items = await prisma.sharePage.findMany({
      include: {
        app: {
          select: {
            id: true,
            name: true,
            slug: true,
            packageType: true,
          },
        },
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
        message: "Failed to load share pages",
        detail: String(err?.message || err),
      },
      { status: 500 },
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = CreateSharePageSchema.safeParse(body);

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
      appId,
      note,
      expiresAt,
      code,
      consumeOnVerify, // CHANGED
      passes,
      accountIds,
    } = parsed.data;
    /**
     * Validate:
     * Tất cả accountIds phải thuộc đúng appId.
     * Tránh bug gắn account app khác vào share page hiện tại.
     */
    const validAccounts = await prisma.appAccount.findMany({
      where: {
        appId,
        id: { in: accountIds },
      },
      select: { id: true },
    });

    if (validAccounts.length !== accountIds.length) {
      return Response.json(
        {
          success: false,
          message: "One or more accounts do not belong to the selected app.",
        },
        { status: 400 },
      );
    }
    let finalCode = (code && code.trim()) || genCode(8);

    for (let i = 0; i < 5; i++) {
      const exists = await prisma.sharePage.findUnique({
        where: { code: finalCode },
      });
      if (!exists) break;
      finalCode = genCode(8);
    }

    const sharePage = await prisma.$transaction(async (tx) => {
      const created = await tx.sharePage.create({
        data: {
          appId,
          code: finalCode,
          note: note ?? null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,

          // CHANGED:
          // Mặc định flow mới là false nếu FE không gửi lên.
          consumeOnVerify: consumeOnVerify ?? false,
        },
      });

      /**
       * Tạo SharePass từ danh sách pass admin nhập.
       * Ở đây đang hash pass trước khi lưu.
       */
      for (const item of passes) {
        const passwordHash = await bcrypt.hash(item.pass, 10);

        await tx.sharePass.create({
          data: {
            sharePageId: created.id,
            passwordHash,
            label: item.label ?? null,
            quotaTotal: item.quota,
            quotaUsed: 0,
          },
        });
      }

      /**
       * Tạo mapping SharePageAccount.
       * Đây là pool account mà bước reveal sẽ dùng.
       */
      await tx.sharePageAccount.createMany({
        data: accountIds.map((appAccountId) => ({
          sharePageId: created.id,
          appAccountId,
        })),
        skipDuplicates: true,
      });

      return created;
    });

    const origin = req.headers.get("origin") || "";
    const url = origin
      ? `${origin}/share/${sharePage.code}`
      : `/share/${sharePage.code}`;

    return Response.json({
      success: true,
      sharePage: {
        id: sharePage.id,
        code: sharePage.code,
        appId: sharePage.appId,
        note: sharePage.note,
        expiresAt: sharePage.expiresAt,
        consumeOnVerify: sharePage.consumeOnVerify, // CHANGED
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
