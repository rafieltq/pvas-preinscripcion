import { NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/auth/api"
import { importStudentsBulk } from "@/lib/db/service"

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminSession(request)
    if (response) return response

    const body = await request.json()

    if (!body || typeof body !== "object" || !Array.isArray(body.students)) {
      return NextResponse.json(
        { error: "Request inválido. Debe enviar { students: [...] }." },
        { status: 400 }
      )
    }

    const summary = await importStudentsBulk(body.students)
    return NextResponse.json(summary)
  } catch (error) {
    console.error("Error importing students:", error)
    return NextResponse.json({ error: "Failed to import students" }, { status: 500 })
  }
}
