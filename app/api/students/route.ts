import { NextResponse } from "next/server";
import { getStudents, createStudent, StudentValidationError, getStudentById, setCorrectionPin } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";
import { sendCorrectionEmail } from "@/lib/email/correction";

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const students = await getStudents();
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const body = await request.json();

    if (body.action === "send-correction-links") {
      const { ids } = body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: "Se requiere un array de IDs" }, { status: 400 });
      }

      const results: Array<{ id: number; success: boolean; email?: string; error?: string }> = [];

      for (const id of ids) {
        const studentId = parseInt(id, 10);
        const student = await getStudentById(studentId);

        if (!student) {
          results.push({ id: studentId, success: false, error: "Estudiante no encontrado" });
          continue;
        }

        if (!student.email) {
          results.push({ id: studentId, success: false, error: "Sin correo electrónico" });
          continue;
        }

        try {
          const { pin, expiresAt } = await setCorrectionPin(studentId);
          const emailResult = await sendCorrectionEmail(student, pin, expiresAt);

          if (emailResult.success) {
            results.push({ id: studentId, success: true, email: student.email });
          } else {
            results.push({ id: studentId, success: false, error: emailResult.error });
          }
        } catch (err) {
          results.push({
            id: studentId,
            success: false,
            error: err instanceof Error ? err.message : "Error desconocido",
          });
        }
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return NextResponse.json({
        success: true,
        summary: {
          total: ids.length,
          successful,
          failed,
        },
        results,
      });
    }

    const student = await createStudent(body);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    if (error instanceof StudentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
