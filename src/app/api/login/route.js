import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { isAdminRole, normalizeEmail, sha256 } from "@/lib/admin-auth";
import {
  createAdminAccessToken,
  JWT_EXPIRES_IN_SEC,
  SESSION_COOKIE_NAME,
} from "@/lib/admin-session";

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body?.email);
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

    if (!isAdminRole(user.role)) {
      return NextResponse.json(
        { ok: false, message: "This portal is available for admin accounts only." },
        { status: 403 },
      );
    }

    const accessToken = await createAdminAccessToken({
      id: user.id,
      email,
      role: user.role,
    });

    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: accessToken,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: JWT_EXPIRES_IN_SEC,
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
