import { NextResponse } from "next/server";
import { getStudentForCorrection, verifyCorrectionPin, updateStudent, StudentValidationError } from "@/lib/db/service";
import { cookies } from "next/headers";

const VERIFICATION_COOKIE_NAME = "correction_verified";
const VERIFICATION_MAX_AGE = 24 * 60 * 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const studentId = parseInt(student_id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID de estudiante inválido" }, { status: 400 });
    }

    const student = await getStudentForCorrection(studentId);

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const verificationCookie = cookieStore.get(`${VERIFICATION_COOKIE_NAME}_${studentId}`);
    const isVerified = verificationCookie?.value === "true";

    return NextResponse.json({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      course_name: student.course_name,
      is_verified: isVerified,
      pin_expired: student.verification_pin_expires_at ? Date.now() > student.verification_pin_expires_at : true,
      pin_locked: student.verification_pin_attempts >= 3,
    });
  } catch (error) {
    console.error("Error fetching correction info:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const studentId = parseInt(student_id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID de estudiante inválido" }, { status: 400 });
    }

    const body = await request.json();
    const { action, pin } = body;

    if (action === "verify-pin") {
      if (!pin || typeof pin !== "string") {
        return NextResponse.json({ error: "PIN es requerido" }, { status: 400 });
      }

      const normalizedPin = pin.trim().toUpperCase();
      if (normalizedPin.length !== 6) {
        return NextResponse.json({ error: "PIN debe tener 6 caracteres" }, { status: 400 });
      }

      const result = await verifyCorrectionPin(studentId, normalizedPin);

      if (result.locked) {
        return NextResponse.json({
          success: false,
          locked: true,
          attempts_remaining: 0,
          error: "Cuenta bloqueada. Ha superado el número máximo de intentos. Por favor contacte a la institución.",
        }, { status: 403 });
      }

      if (!result.success) {
        return NextResponse.json({
          success: false,
          locked: false,
          attempts_remaining: result.attemptsRemaining,
          error: `PIN incorrecto. Le quedan ${result.attemptsRemaining} intento(s).`,
        }, { status: 401 });
      }

      const cookieStore = await cookies();
      cookieStore.set(`${VERIFICATION_COOKIE_NAME}_${studentId}`, "true", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: VERIFICATION_MAX_AGE,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        verified: true,
        message: "Verificación exitosa",
      });
    }

    if (action === "check-verification") {
      const cookieStore = await cookies();
      const verificationCookie = cookieStore.get(`${VERIFICATION_COOKIE_NAME}_${studentId}`);
      const isVerified = verificationCookie?.value === "true";

      if (!isVerified) {
        return NextResponse.json({ verified: false }, { status: 401 });
      }

      const student = await getStudentForCorrection(studentId);
      if (!student) {
        return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
      }

      return NextResponse.json({
        verified: true,
        student: {
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          cedula: student.cedula,
          age: student.age,
          gender: student.gender,
          birth_date: student.birth_date,
          father_first_name: student.father_first_name,
          father_last_name: student.father_last_name,
          father_phone: student.father_phone,
          father_email: student.father_email,
          mother_first_name: student.mother_first_name,
          mother_last_name: student.mother_last_name,
          mother_phone: student.mother_phone,
          mother_email: student.mother_email,
          guardian_first_name: student.guardian_first_name,
          guardian_last_name: student.guardian_last_name,
          guardian_phone: student.guardian_phone,
          guardian_email: student.guardian_email,
          email: student.email,
          phone: student.phone,
          education_level: student.education_level,
          previous_institution: student.previous_institution,
          course_id: student.course_id,
          course_name: student.course_name,
        },
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    console.error("Error in correction POST:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ student_id: string }> }
) {
  try {
    const { student_id } = await params;
    const studentId = parseInt(student_id, 10);

    if (isNaN(studentId)) {
      return NextResponse.json({ error: "ID de estudiante inválido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const verificationCookie = cookieStore.get(`${VERIFICATION_COOKIE_NAME}_${studentId}`);
    const isVerified = verificationCookie?.value === "true";

    if (!isVerified) {
      return NextResponse.json({ error: "No autorizado. Debe verificar su identidad primero." }, { status: 401 });
    }

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      "first_name", "last_name", "cedula", "age", "gender", "birth_date",
      "father_first_name", "father_last_name", "father_phone", "father_email",
      "mother_first_name", "mother_last_name", "mother_phone", "mother_email",
      "guardian_first_name", "guardian_last_name", "guardian_phone", "guardian_email",
      "email", "phone", "education_level", "previous_institution"
    ];

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field];
      }
    }

    const student = await updateStudent(studentId, updateData);

    if (!student) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Datos actualizados exitosamente",
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        cedula: student.cedula,
        email: student.email,
      },
    });
  } catch (error) {
    console.error("Error updating student:", error);
    if (error instanceof StudentValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
