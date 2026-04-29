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
    const studentId = parseInt(id);
    const body = await request.json();

    // Allow updating status only, as before, for minimal/legacy edits.
    if (Object.keys(body).length === 1 && Object.prototype.hasOwnProperty.call(body, "status")) {
      const student = await updateStudentStatus(studentId, body.status);
      if (!student) {
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }
      return NextResponse.json(student);
    }

    // Partial edit of other student fields, with validation on only supplied fields.
    const allowedFields = [
      "first_name", "last_name", "cedula", "age", "gender", "birth_date",
      "father_first_name", "father_last_name", "father_phone", "father_email",
      "mother_first_name", "mother_last_name", "mother_phone", "mother_email",
      "guardian_first_name", "guardian_last_name", "guardian_phone", "guardian_email",
      "email", "phone", "education_level", "previous_institution", "course_id", "notes"
    ];
    const updateData: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updateData[key] = body[key];
      }
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided for update." }, { status: 400 });
    }

    // Validation — only on fields present.
    const details: Record<string, string> = {};
    // Simple validations (type/format checks)
    if ("age" in updateData) {
      const age = Number(updateData.age);
      if (isNaN(age) || age < 1 || age > 100) {
        details["age"] = "La edad debe ser un número entre 1 y 100";
      }
    }
    if ("cedula" in updateData) {
      const cedulaDigits = String(updateData.cedula || "").replace(/\D/g, "");
      if (cedulaDigits.length < 5 || cedulaDigits.length > 20) {
        details["cedula"] = `La cédula debe tener entre 5 y 20 dígitos. Actualmente tiene ${cedulaDigits.length} dígitos.`;
      }
    }
    const DR_PHONE_REGEX = /^(809|829|849)\d{7}$/;
    const phoneFields = [
      { field: "father_phone", label: "Teléfono del padre" },
      { field: "mother_phone", label: "Teléfono de la madre" },
      { field: "guardian_phone", label: "Teléfono del tutor" },
    ];
    for (const { field, label } of phoneFields) {
      if (field in updateData && updateData[field]) {
        const phone = String(updateData[field]);
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10) {
          details[field] = `El \"${label}\" debe tener exactamente 10 dígitos. Actualmente tiene ${digits.length} dígito(s). Formato esperado: 809-000-0000`;
        } else if (digits.length > 10) {
          details[field] = `El \"${label}\" tiene ${digits.length} dígitos. Máximo permitido: 10 dígitos.`;
        } else if (!DR_PHONE_REGEX.test(digits)) {
          details[field] = `El \"${label}\" es inválido. Debe comenzar con 809, 829 o 849. Ejemplo: 809-555-0100`;
        }
      }
    }
    // Validation for representatives: for any rep group with a present field, require their "partial group" to be complete (all 3 fields)...
    [
      { prefix: "father", label: "del padre" },
      { prefix: "mother", label: "de la madre" },
      { prefix: "guardian", label: "del tutor" },
    ].forEach(rep => {
      const first = updateData[`${rep.prefix}_first_name`];
      const last = updateData[`${rep.prefix}_last_name`];
      const phone = updateData[`${rep.prefix}_phone`];
      const filled = [first, last, phone].filter(v => v !== undefined && v !== null && String(v).trim().length > 0);
      if (filled.length > 0 && filled.length < 3) {
        const missing: string[] = [];
        if (!first || !String(first).trim()) missing.push("nombre");
        if (!last || !String(last).trim()) missing.push("apellido");
        if (!phone || !String(phone).trim()) missing.push("teléfono válido (10 dígitos)");
        details[`${rep.prefix}_first_name`] = `Faltan campos ${rep.label}: ${missing.join(", ")}`;
      }
    });
    // No need to require at least one complete rep for partial update -- only validate for groups being touched.

    if (Object.keys(details).length > 0) {
      return NextResponse.json({ error: "Por favor corrija los campos indicados.", details }, { status: 400 });
    }

    let student = null;
    try {
      // Update
      const updateStudent = (await import("@/lib/db/service")).updateStudent;
      student = await updateStudent(studentId, updateData);
    } catch (error) {
      return NextResponse.json({ error: "Error interno al actualizar estudiante" }, { status: 500 });
    }
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(student);
  } catch (error) {
    console.error("Error updating student (PATCH api/students/[id]):", error);
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
