import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sha256 } from "@/lib/admin-auth";
import { isAdminRole, normalizeEmail } from "@/lib/admin-auth-shared";
import {
  createAdminAccessToken,
  JWT_EXPIRES_IN_SEC,
  SESSION_COOKIE_NAME,
} from "@/lib/admin-session";

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

async function verifyAdminPassword(inputPassword, storedPassword) {
  const normalizedStoredPassword = String(storedPassword || "");

  if (!normalizedStoredPassword) {
    return false;
  }

  // Ho tro ca hash bcrypt moi va hash sha256 cu de khong lam vo tai khoan da ton tai.
  if (normalizedStoredPassword.startsWith("$2a$")
    || normalizedStoredPassword.startsWith("$2b$")
    || normalizedStoredPassword.startsWith("$2y$")) {
    return bcrypt.compare(inputPassword, normalizedStoredPassword);
  }

  const hashed = sha256(inputPassword);
  return safeEqual(normalizedStoredPassword, hashed);
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

    const passwordMatched = await verifyAdminPassword(password, user.password);
    if (!passwordMatched) {
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
