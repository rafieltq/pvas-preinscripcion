import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/api"

export async function GET(request: Request) {
  const { session, response } = await requireAdminSession(request)
  if (response) return response

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session!.userId,
      email: session!.email,
      role: session!.role,
    },
  })
}
