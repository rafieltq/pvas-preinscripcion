import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/api";
import { getStudents } from "@/lib/db/service";
import type { Student } from "@/lib/db/types";

const EXPORT_FIELDS: Array<keyof Student> = [
  "id",
  "first_name",
  "last_name",
  "cedula",
  "age",
  "gender",
  "birth_date",
  "father_first_name",
  "father_last_name",
  "father_phone",
  "father_email",
  "mother_first_name",
  "mother_last_name",
  "mother_phone",
  "mother_email",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
  "guardian_email",
  "email",
  "phone",
  "education_level",
  "previous_institution",
  "course_id",
  "course_name",
  "status",
  "notes",
  "verification_pin",
  "verification_pin_expires_at",
  "verification_pin_attempts",
  "correction_sent_at",
  "created_at",
  "updated_at",
];

const SPANISH_HEADERS: Record<keyof Student, string> = {
  id: "id",
  first_name: "nombre",
  last_name: "apellido",
  cedula: "cedula",
  age: "edad",
  gender: "genero",
  birth_date: "fecha nacimiento",
  father_first_name: "nombre padre",
  father_last_name: "apellido padre",
  father_phone: "telefono padre",
  father_email: "correo padre",
  mother_first_name: "nombre madre",
  mother_last_name: "apellido madre",
  mother_phone: "telefono madre",
  mother_email: "correo madre",
  guardian_first_name: "nombre tutor",
  guardian_last_name: "apellido tutor",
  guardian_phone: "telefono tutor",
  guardian_email: "correo tutor",
  email: "correo estudiante",
  phone: "telefono estudiante",
  education_level: "nivel educativo",
  previous_institution: "institucion anterior",
  course_id: "id carrera",
  course_name: "carrera",
  status: "estado",
  notes: "notas",
  verification_pin: "pin verificacion",
  verification_pin_expires_at: "pin expira en",
  verification_pin_attempts: "intentos pin",
  correction_sent_at: "correccion enviada en",
  created_at: "creado en",
  updated_at: "actualizado en",
};

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function buildStudentsCsv(students: Student[]): string {
  const headerRow = EXPORT_FIELDS.map((field) => SPANISH_HEADERS[field]).join(",");
  const rows = students.map((student) =>
    EXPORT_FIELDS.map((field) => escapeCsvValue(student[field])).join(",")
  );

  return [headerRow, ...rows].join("\n");
}

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const students = await getStudents();
    const csv = buildStudentsCsv(students);
    const now = new Date().toISOString().slice(0, 10);
    const filename = `estudiantes-${now}.csv`;

    return new NextResponse(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting students:", error);
    return NextResponse.json({ error: "Failed to export students" }, { status: 500 });
  }
}
