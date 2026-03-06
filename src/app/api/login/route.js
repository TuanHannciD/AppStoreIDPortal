import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(body?.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Missing credentials." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const hashed = sha256(password);
    if (!safeEqual(user.password, hashed)) {
      return NextResponse.json(
        { ok: false, message: "Invalid email or password." },
        { status: 401 },
      );
    }

    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set({
      name: "session_user",
      value: user.id,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (err) {
    console.error("login_error", err);
    return NextResponse.json(
      { ok: false, message: "Server error." },
      { status: 500 },
    );
  }
}
