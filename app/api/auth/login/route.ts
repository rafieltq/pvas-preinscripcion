import { NextResponse } from "next/server"
import { getUserByEmail, updateUserLastLogin } from "@/lib/db/service"
import { verifyPassword } from "@/lib/auth/password"
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
} from "@/lib/auth/session"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || user.active !== 1) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Credenciales inválidas" }, { status: 401 })
    }

    await updateUserLastLogin(user.id)
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS,
    })

    return response
  } catch (error) {
    console.error("Error during login:", error)
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 })
  }
}
