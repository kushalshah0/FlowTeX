import { type NextRequest, NextResponse } from "next/server";
import { decodeSession } from "@/lib/auth";

const publicPaths = [
  "/_next",
  "/favicon.ico",
  "/wasm",
  "/workers",
  "/login",
  "/auth",
  "/api",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("auth_token");

  if (!authCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const session = decodeSession(authCookie.value);
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session.r !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
