import { NextRequest, NextResponse } from "next/server";

const SIGNAL_COOKIE = "gk-auth";
const AUTH_TOKEN_COOKIES = ["__Host-auth_token", "auth_token"] as const;

const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/turnos"];
const AUTH_ROUTES = ["/login", "/register"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + padding);
}

/**
 * Returns true when the cookie carries a JWT whose `exp` claim is still in
 * the future. Signature is NOT verified here — that is the backend's job
 * on the next API call. The point of this check is purely UX: redirect
 * obviously-expired sessions before the page hydrates.
 */
function jwtLooksFresh(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as { exp?: number };
    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function readAuthToken(req: NextRequest): string | undefined {
  for (const name of AUTH_TOKEN_COOKIES) {
    const value = req.cookies.get(name)?.value;
    if (value) return value;
  }
  return undefined;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSignal = req.cookies.get(SIGNAL_COOKIE)?.value === "1";
  const tokenFresh = jwtLooksFresh(readAuthToken(req));
  const isAuthenticated = hasSignal && tokenFresh;

  if (isProtected(pathname) && !isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    const response = NextResponse.redirect(url);
    if (hasSignal && !tokenFresh) {
      response.cookies.delete(SIGNAL_COOKIE);
      for (const name of AUTH_TOKEN_COOKIES) {
        response.cookies.delete(name);
      }
    }
    return response;
  }

  if (isAuthRoute(pathname) && isAuthenticated) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)"],
};
