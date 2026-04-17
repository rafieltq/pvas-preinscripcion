import { NextResponse } from "next/server";
import { getStudentById, deleteStudent, updateStudentStatus, setCorrectionPin } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";
import { sendCorrectionEmail } from "@/lib/email/correction";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const studentId = parseInt(id, 10);
    const student = await getStudentById(studentId);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (!student.email) {
      return NextResponse.json({ error: "El estudiante no tiene correo electrónico registrado" }, { status: 400 });
    }

    const { pin, expiresAt } = await setCorrectionPin(studentId);

    const emailResult = await sendCorrectionEmail(student, pin, expiresAt);

    if (!emailResult.success) {
      return NextResponse.json({
        error: "PIN generado pero falló el envío del correo",
        details: emailResult.error,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Enlace de corrección enviado exitosamente",
      email: student.email,
    });
  } catch (error) {
    console.error("Error sending correction link:", error);
    return NextResponse.json({ error: "Failed to send correction link" }, { status: 500 });
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
