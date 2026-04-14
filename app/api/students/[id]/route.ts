import { NextResponse } from "next/server";
import { getStudentById, deleteStudent, updateStudentStatus } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const student = await getStudentById(parseInt(id));
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error fetching student:", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const body = await request.json();
    const student = await updateStudentStatus(parseInt(id), body.status);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const deleted = await deleteStudent(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
