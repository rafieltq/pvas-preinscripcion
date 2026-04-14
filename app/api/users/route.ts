import { NextResponse } from "next/server";
import { createUser, getUsers } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";
import { hashPassword } from "@/lib/auth/password";

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const users = await getUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const body = await request.json();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const name = String(body?.name || "").trim();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    const password_hash = await hashPassword(password);
    const user = await createUser({ email, password_hash, name, role: "admin", active: 1 });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
