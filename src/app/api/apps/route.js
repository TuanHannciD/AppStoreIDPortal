import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdminSession } from "@/lib/admin-session";

const createAppSchema = z.object({
  name: z.string().trim().min(1, "Tên app là bắt buộc."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug là bắt buộc.")
    .regex(/^[a-z0-9-]+$/, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang."),
  packageType: z.string().trim().min(1, "Loại gói là bắt buộc."),
  description: z.string().trim().nullable().optional(),
});

export async function GET() {
  const apps = await prisma.app.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      packageType: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, apps });
}

export async function POST(req) {
  const session = await getCurrentAdminSession();
  if (!session) {
    return Response.json(
      { success: false, message: "Bạn chưa đăng nhập." },
      { status: 401 },
    );
  }

  try {
    const raw = await req.json();
    const parsed = createAppSchema.safeParse({
      ...raw,
      description: raw?.description?.trim() ? raw.description.trim() : null,
    });

    if (!parsed.success) {
      return Response.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ.",
        },
        { status: 400 },
      );
    }

    const item = await prisma.app.create({
      data: {
        ...parsed.data,
        ownerId: session.userId,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        packageType: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return Response.json({ success: true, item }, { status: 201 });
  } catch (error) {
    if (error?.code === "P2002") {
      return Response.json(
        { success: false, message: "Slug đã tồn tại. Hãy chọn slug khác." },
        { status: 409 },
      );
    }

    console.error("create_app_failed", error);
    return Response.json(
      { success: false, message: "Không thể tạo app." },
      { status: 500 },
    );
  }
}
