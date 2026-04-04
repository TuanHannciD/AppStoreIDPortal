import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  verifyAdminAccessToken,
} from "@/lib/admin-session";

function isProtectedAdminApi(pathname) {
  if (!pathname.startsWith("/api/share-pages")) {
    return false;
  }

  return !pathname.includes("/by-code/");
}

function clearSessionCookie(response) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname.startsWith("/admin");
  const isAdminApi = isProtectedAdminApi(pathname);

  if (!isAdminPage && !isAdminApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await verifyAdminAccessToken(token);

  if (session) {
    return NextResponse.next();
  }

  if (isAdminApi) {
    return clearSessionCookie(
      NextResponse.json(
        { ok: false, message: "Unauthorized." },
        { status: 401 },
      ),
    );
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return clearSessionCookie(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/share-pages/:path*",
  ],
};
