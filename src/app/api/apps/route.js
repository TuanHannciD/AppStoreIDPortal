import { prisma } from "@/lib/prisma";

export async function GET() {
  const apps = await prisma.app.findMany({
    select: { id: true, slug: true, name: true, packageType: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, apps });
}
