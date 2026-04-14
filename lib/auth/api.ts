import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME, verifySessionToken, type AdminSession } from "./session"

function readCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("cookie")
  if (!cookieHeader) return null

  const parts = cookieHeader.split(";")
  for (const part of parts) {
    const [key, ...valueParts] = part.trim().split("=")
    if (key === name) {
      return decodeURIComponent(valueParts.join("="))
    }
  }

  return null
}

export async function requireAdminSession(request: Request): Promise<{
  session: AdminSession | null
  response: NextResponse | null
}> {
  const token = readCookie(request, SESSION_COOKIE_NAME)
  const session = await verifySessionToken(token)

  if (!session) {
    return {
      session: null,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  return { session, response: null }
}

export async function getOptionalAdminSession(request: Request): Promise<AdminSession | null> {
  const token = readCookie(request, SESSION_COOKIE_NAME)
  return verifySessionToken(token)
}
