import { NextResponse } from "next/server";
import { deleteUser, getUserById, updateUser } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";
import { hashPassword } from "@/lib/auth/password";

function isInvalidId(id: number) {
  return Number.isNaN(id) || id <= 0;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isInvalidId(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response, session } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isInvalidId(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await request.json();
    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const email = body?.email !== undefined ? String(body.email).trim().toLowerCase() : undefined;
    const password = body?.password !== undefined ? String(body.password) : undefined;
    const active = body?.active !== undefined ? Number(body.active) : undefined;

    if (name !== undefined && !name) {
      return NextResponse.json({ error: "El nombre no puede estar vacio" }, { status: 400 });
    }

    if (email !== undefined && !email) {
      return NextResponse.json({ error: "El correo no puede estar vacio" }, { status: 400 });
    }

    if (active !== undefined && active !== 0 && active !== 1) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
    }

    if (password !== undefined && password.length > 0 && password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 }
      );
    }

    if (session && session.userId === userId && active === 0) {
      return NextResponse.json({ error: "No puedes desactivar tu propio usuario" }, { status: 400 });
    }

    const password_hash =
      password && password.length >= 8 ? await hashPassword(password) : undefined;

    const user = await updateUser(userId, {
      name,
      email,
      active,
      password_hash,
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);

    if (error instanceof Error && error.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Ya existe un usuario con este correo" }, { status: 409 });
    }

    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response, session } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const userId = parseInt(id, 10);

    if (isInvalidId(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (session && session.userId === userId) {
      return NextResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 });
    }

    const deleted = await deleteUser(userId);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
