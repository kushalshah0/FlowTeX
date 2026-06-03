import { type NextRequest, NextResponse } from "next/server";

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

  if (!authCookie || authCookie.value !== "nexustex_demo") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
