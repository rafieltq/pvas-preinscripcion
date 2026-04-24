import { NextResponse } from "next/server";
import { getStudents, createStudent, StudentValidationError, getStudentById, setCorrectionPin } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";
import { sendCorrectionEmail } from "@/lib/email/correction";

interface ValidationDetail {
  [field: string]: string;
}

function validateStudentData(body: Record<string, unknown>): { valid: boolean; details: ValidationDetail; message: string } {
  const details: ValidationDetail = {};
  
  const requiredStudentFields: { field: string; label: string }[] = [
    { field: "first_name", label: "Nombre del estudiante" },
    { field: "last_name", label: "Apellido del estudiante" },
    { field: "cedula", label: "Cédula" },
    { field: "age", label: "Edad" },
    { field: "gender", label: "Género" },
    { field: "birth_date", label: "Fecha de nacimiento" },
  ];
  
  for (const { field, label } of requiredStudentFields) {
    const value = body[field];
    if (value === null || value === undefined || value === "" || (typeof value === "string" && !value.trim())) {
      details[field] = `El campo "${label}" es requerido`;
    }
  }
  
  if (body.age !== null && body.age !== undefined) {
    const age = Number(body.age);
    if (isNaN(age) || age < 1 || age > 100) {
      details.age = "La edad debe ser un número entre 1 y 100";
    }
  }
  
  if (body.cedula) {
    const cedulaDigits = body.cedula.toString().replace(/\D/g, "");
    if (cedulaDigits.length < 5 || cedulaDigits.length > 20) {
      details.cedula = `La cédula debe tener entre 5 y 20 dígitos. Actualmente tiene ${cedulaDigits.length} dígitos.`;
    }
  }
  
  const DR_PHONE_REGEX = /^(809|829|849)\d{7}$/;
  
  const phoneFields = [
    { field: "father_phone", label: "Teléfono del padre" },
    { field: "mother_phone", label: "Teléfono de la madre" },
    { field: "guardian_phone", label: "Teléfono del tutor" },
  ];
  
  for (const { field, label } of phoneFields) {
    const phone = body[field] as string | null;
    if (phone && phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10) {
        details[field] = `El "${label}" debe tener exactamente 10 dígitos. Actualmente tiene ${digits.length} dígito(s). Formato esperado: 809-000-0000`;
      } else if (digits.length > 10) {
        details[field] = `El "${label}" tiene ${digits.length} dígitos. Máximo permitido: 10 dígitos.`;
      } else if (!DR_PHONE_REGEX.test(digits)) {
        details[field] = `El "${label}" es inválido. Debe comenzar con 809, 829 o 849. Ejemplo: 809-555-0100`;
      }
    }
  }
  
  const repFields = [
    {
      prefix: "father",
      label: "del padre",
      phoneField: "father_phone",
    },
    {
      prefix: "mother",
      label: "de la madre",
      phoneField: "mother_phone",
    },
    {
      prefix: "guardian",
      label: "del tutor",
      phoneField: "guardian_phone",
    },
  ];
  
  for (const rep of repFields) {
    const firstName = body[`${rep.prefix}_first_name`] as string | null;
    const lastName = body[`${rep.prefix}_last_name`] as string | null;
    const phone = body[rep.phoneField] as string | null;
    
    const hasFirstName = firstName && firstName.trim();
    const hasLastName = lastName && lastName.trim();
    const hasPhone = phone && phone.trim();
    
    const filledCount = [hasFirstName, hasLastName, hasPhone].filter(Boolean).length;
    
    if (filledCount > 0 && filledCount < 3) {
      const missing: string[] = [];
      if (!hasFirstName) missing.push("nombre");
      if (!hasLastName) missing.push("apellido");
      if (!hasPhone) missing.push("teléfono válido (10 dígitos)");
      
      details[`${rep.prefix}_first_name`] = `Faltan campos ${rep.label}: ${missing.join(", ")}`;
    }
  }
  
  const hasFatherRep = (body.father_first_name && body.father_first_name.trim()) &&
                       (body.father_last_name && body.father_last_name.trim()) &&
                       body.father_phone && DR_PHONE_REGEX.test(body.father_phone.toString().replace(/\D/g, ""));
  const hasMotherRep = (body.mother_first_name && body.mother_first_name.trim()) &&
                       (body.mother_last_name && body.mother_last_name.trim()) &&
                       body.mother_phone && DR_PHONE_REGEX.test(body.mother_phone.toString().replace(/\D/g, ""));
  const hasGuardianRep = (body.guardian_first_name && body.guardian_first_name.trim()) &&
                          (body.guardian_last_name && body.guardian_last_name.trim()) &&
                          body.guardian_phone && DR_PHONE_REGEX.test(body.guardian_phone.toString().replace(/\D/g, ""));
  
  if (!hasFatherRep && !hasMotherRep && !hasGuardianRep) {
    details.representatives = "Debe completar al menos un representante (padre, madre o tutor) con: nombre, apellido y teléfono válido de 10 dígitos.";
  }
  
  const valid = Object.keys(details).length === 0;
  const message = valid ? "" : "Por favor complete todos los campos requeridos correctamente.";
  
  return { valid, details, message };
}

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

    const validation = validateStudentData(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message, details: validation.details },
        { status: 400 }
      );
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
