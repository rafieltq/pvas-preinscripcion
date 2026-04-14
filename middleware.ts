import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session"

const PROTECTED_ADMIN_PATHS = [
  "/admin",
  "/admin/students",
  "/admin/users",
  "/admin/courses",
  "/admin/settings",
]

function isProtectedAdminPath(pathname: string) {
  return PROTECTED_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin/login") {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
    const session = await verifySessionToken(token)
    if (session) {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return NextResponse.next()
  }

  if (!isProtectedAdminPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = await verifySessionToken(token)
  if (session) {
    return NextResponse.next()
  }

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/admin/:path*"],
}
