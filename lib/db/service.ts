import { turso } from "./turso";
import type {
  Course,
  Student,
  Setting,
  StudentFormData,
  User,
  CreateUserInput,
  UserSummary,
  UpdateUserInput,
} from "./types";

export class StudentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudentValidationError";
  }
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateRepresentatives(
  data: Pick<
    StudentFormData,
    | "father_first_name"
    | "father_last_name"
    | "father_phone"
    | "mother_first_name"
    | "mother_last_name"
    | "mother_phone"
    | "guardian_first_name"
    | "guardian_last_name"
    | "guardian_phone"
  >
): string | null {
  const representatives = [
    {
      label: "padre",
      firstName: data.father_first_name,
      lastName: data.father_last_name,
      phone: data.father_phone,
    },
    {
      label: "madre",
      firstName: data.mother_first_name,
      lastName: data.mother_last_name,
      phone: data.mother_phone,
    },
    {
      label: "tutor",
      firstName: data.guardian_first_name,
      lastName: data.guardian_last_name,
      phone: data.guardian_phone,
    },
  ] as const;

  let hasCompleteRepresentative = false;

  for (const representative of representatives) {
    const hasFirstName = hasText(representative.firstName);
    const hasLastName = hasText(representative.lastName);
    const hasPhone = hasText(representative.phone);
    const filledFields = Number(hasFirstName) + Number(hasLastName) + Number(hasPhone);

    if (filledFields === 3) {
      hasCompleteRepresentative = true;
    }
  }

  if (!hasCompleteRepresentative) {
    return "Debe incluir al menos un representante completo (padre, madre o tutor).";
  }

  return null;
}

// ============= COURSES =============

export async function getCourses(): Promise<Course[]> {
  const result = await turso.execute("SELECT * FROM courses ORDER BY name");
  return result.rows as unknown as Course[];
}

export async function getActiveCourses(): Promise<Course[]> {
  const result = await turso.execute(
    "SELECT * FROM courses WHERE active = 1 ORDER BY name"
  );
  return result.rows as unknown as Course[];
}

export async function getAvailableCourses(): Promise<Course[]> {
  const result = await turso.execute(
    "SELECT * FROM courses WHERE active = 1 AND enrolled < capacity ORDER BY name"
  );
  return result.rows as unknown as Course[];
}

export async function getCourseById(id: number): Promise<Course | null> {
  const result = await turso.execute({
    sql: "SELECT * FROM courses WHERE id = ?",
    args: [id],
  });
  return (result.rows[0] as unknown as Course) || null;
}

export async function createCourse(
  course: Pick<Course, "name" | "family" | "description" | "duration" | "schedule" | "capacity" | "active">
): Promise<Course> {
  const result = await turso.execute({
    sql: "INSERT INTO courses (name, family, description, duration, schedule, capacity, active) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *",
    args: [course.name, course.family, course.description, course.duration, course.schedule, course.capacity, course.active],
  });
  return result.rows[0] as unknown as Course;
}

export async function updateCourse(
  id: number,
  course: Partial<Pick<Course, "name" | "family" | "description" | "duration" | "schedule" | "capacity" | "active">>
): Promise<Course | null> {
  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  if (course.name !== undefined) {
    fields.push("name = ?");
    args.push(course.name);
  }
  if (course.family !== undefined) {
    fields.push("family = ?");
    args.push(course.family);
  }
  if (course.description !== undefined) {
    fields.push("description = ?");
    args.push(course.description);
  }
  if (course.duration !== undefined) {
    fields.push("duration = ?");
    args.push(course.duration);
  }
  if (course.schedule !== undefined) {
    fields.push("schedule = ?");
    args.push(course.schedule);
  }
  if (course.capacity !== undefined) {
    fields.push("capacity = ?");
    args.push(course.capacity);
  }
  if (course.active !== undefined) {
    fields.push("active = ?");
    args.push(course.active);
  }

  if (fields.length === 0) return getCourseById(id);

  fields.push("updated_at = datetime('now')");
  args.push(id);
  const result = await turso.execute({
    sql: `UPDATE courses SET ${fields.join(", ")} WHERE id = ? RETURNING *`,
    args,
  });
  return (result.rows[0] as unknown as Course) || null;
}

export async function deleteCourse(id: number): Promise<boolean> {
  const result = await turso.execute({
    sql: "DELETE FROM courses WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

// ============= STUDENTS =============

export async function getStudents(): Promise<Student[]> {
  const result = await turso.execute(`
    SELECT s.*, c.name as course_name 
    FROM students s 
    LEFT JOIN courses c ON s.course_id = c.id 
    ORDER BY s.created_at DESC
  `);
  return result.rows as unknown as Student[];
}

export async function getStudentById(id: number): Promise<Student | null> {
  const result = await turso.execute({
    sql: `
      SELECT s.*, c.name as course_name 
      FROM students s 
      LEFT JOIN courses c ON s.course_id = c.id 
      WHERE s.id = ?
    `,
    args: [id],
  });
  return (result.rows[0] as unknown as Student) || null;
}

export async function createStudent(student: StudentFormData): Promise<Student> {
  const representativeValidationError = validateRepresentatives(student);
  if (representativeValidationError) {
    throw new StudentValidationError(representativeValidationError);
  }

  const fields = [
    "first_name", "last_name", "cedula", "age", "gender", "birth_date",
    "father_first_name", "father_last_name", "father_phone", "father_email",
    "mother_first_name", "mother_last_name", "mother_phone", "mother_email",
    "guardian_first_name", "guardian_last_name", "guardian_phone", "guardian_email",
    "email", "phone", "education_level", "previous_institution", "course_id"
  ];

  const args: (string | number | null)[] = [
    student.first_name,
    student.last_name,
    student.cedula,
    student.age,
    student.gender,
    student.birth_date,
    student.father_first_name,
    student.father_last_name,
    student.father_phone,
    student.father_email,
    student.mother_first_name,
    student.mother_last_name,
    student.mother_phone,
    student.mother_email,
    student.guardian_first_name,
    student.guardian_last_name,
    student.guardian_phone,
    student.guardian_email,
    student.email,
    student.phone,
    student.education_level,
    student.previous_institution,
    student.course_id,
  ];

  if (student.created_at) {
    fields.push("created_at");
    args.push(student.created_at);
  }

  const result = await turso.execute({
    sql: `INSERT INTO students (${fields.join(", ")}) VALUES (${fields.map(() => "?").join(", ")}) RETURNING *`,
    args,
  });

  // Increment enrolled count for the course
  if (student.course_id !== null) {
    await turso.execute({
      sql: "UPDATE courses SET enrolled = enrolled + 1, updated_at = datetime('now') WHERE id = ?",
      args: [student.course_id],
    });
  }

  return result.rows[0] as unknown as Student;
}

type ImportStatus = "created" | "skipped" | "error";

export interface StudentImportRowResult {
  row: number;
  cedula: string;
  status: ImportStatus;
  reason?: string;
}

export interface StudentImportSummary {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  results: StudentImportRowResult[];
  downloadableRows: Array<Record<string, string | number | null>>;
}

export const VALID_IMPORT_COLUMNS = [
  "first_name",
  "last_name",
  "cedula",
  "email",
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
  "phone",
  "education_level",
  "previous_institution",
  "course_id",
  "created_at",
] as const;

export const REQUIRED_IMPORT_COLUMNS = ["first_name", "last_name", "email"] as const;

const nullableImportFields = new Set([
  "age",
  "gender",
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
  "created_at",
]);

export interface CsvValidationResult {
  valid: boolean;
  missingColumns: string[];
  unknownColumns: string[];
  errors: string[];
}

export function validateCsvColumns(headers: string[]): CsvValidationResult {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());
  const missingColumns: string[] = [];
  const unknownColumns: string[] = [];

  for (const required of REQUIRED_IMPORT_COLUMNS) {
    if (!normalizedHeaders.includes(required)) {
      missingColumns.push(required);
    }
  }

  for (const header of normalizedHeaders) {
    if (!VALID_IMPORT_COLUMNS.includes(header as typeof VALID_IMPORT_COLUMNS[number])) {
      unknownColumns.push(header);
    }
  }

  return {
    valid: missingColumns.length === 0 && unknownColumns.length === 0,
    missingColumns,
    unknownColumns,
    errors: [],
  };
}

function validateImportedStudentRow(raw: unknown): { data?: StudentFormData; reason?: string } {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { reason: "Fila inválida: se esperaba un objeto JSON." };
  }

  const record = raw as Record<string, unknown>;
  const normalized: Record<string, string | number | null> = {};

  for (const key of VALID_IMPORT_COLUMNS) {
    const value = record[key];

if (value === undefined) {
    normalized[key] = null;
    continue;
    }

    if (key === "course_id") {
      if (value === null || value === "" || value === undefined) {
        normalized.course_id = null;
        continue;
      }

      if (typeof value === "number" && Number.isInteger(value) && value > 0) {
        normalized.course_id = value;
        continue;
      }

      const numValue = Number(value);
      if (Number.isInteger(numValue) && numValue > 0) {
        normalized.course_id = numValue;
        continue;
      }

      return { reason: `course_id debe ser un número entero positivo. Valor recibido: "${value}"` };
    }

    if (key === "age") {
      if (value === null || value === "" || value === undefined) {
        normalized.age = null;
        continue;
      }

      const numValue = Number(value);
      if (Number.isInteger(numValue) && numValue > 0 && numValue < 150) {
        normalized.age = numValue;
        continue;
      }

      return { reason: `age debe ser un número entero positivo. Valor recibido: "${value}"` };
    }

    if (key === "gender") {
      if (value === null || value === "" || value === undefined) {
        normalized.gender = null;
        continue;
      }

      const strValue = String(value).trim().toLowerCase();
      if (strValue === "m" || strValue === "masculino") {
        normalized.gender = "M";
        continue;
      }
      if (strValue === "f" || strValue === "femenino") {
        normalized.gender = "F";
        continue;
      }

      return { reason: `gender debe ser "M", "Masculino", "F" o "Femenino". Valor recibido: "${value}"` };
    }

    if (key === "created_at") {
      if (value === null || value === "" || value === undefined) {
        normalized.created_at = null;
        continue;
      }

      const dateStr = String(value).trim();
      const dateRegex = /^\d{1,2}\/\d{1,2}\/\d{4}( \d{1,2}:\d{2}(:\d{2})?)?$/;
      const isoDateRegex = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}(:\d{2})?)?$/;

      if (dateRegex.test(dateStr) || isoDateRegex.test(dateStr)) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const formattedDate = date.toISOString().replace("T", " ").substring(0, 19);
          normalized.created_at = formattedDate;
          continue;
        }
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const formattedDate = date.toISOString().replace("T", " ").substring(0, 19);
        normalized.created_at = formattedDate;
        continue;
      }

      return { reason: `created_at tiene formato inválido. Use: DD/MM/YYYY HH:MM:SS o YYYY-MM-DD HH:MM:SS. Valor recibido: "${value}"` };
    }

    if (nullableImportFields.has(key)) {
      if (value === null || value === "" || value === undefined) {
        normalized[key] = null;
        continue;
      }

      if (typeof value !== "string") {
        return { reason: `El campo ${key} debe ser texto o vacío.` };
      }

      normalized[key] = value.trim();
      continue;
    }

    if (typeof value !== "string") {
      return { reason: `El campo ${key} debe ser texto.` };
    }

    normalized[key] = value.trim();
  }

  for (const field of REQUIRED_IMPORT_COLUMNS) {
    if (!normalized[field]) {
      return { reason: `El campo "${field}" es obligatorio.` };
    }
  }

  const representativeValidationError = validateRepresentatives(normalized as StudentFormData);
  if (representativeValidationError) {
    return { reason: representativeValidationError };
  }

  return { data: normalized as unknown as StudentFormData };
}

export async function importStudentsBulk(rawRows: unknown[]): Promise<StudentImportSummary> {
  const summary: StudentImportSummary = {
    total: rawRows.length,
    created: 0,
    skipped: 0,
    errors: 0,
    results: [],
    downloadableRows: [],
  };

  const normalizedRows: Array<{ row: number; data: StudentFormData }> = [];

  for (let index = 0; index < rawRows.length; index += 1) {
    const rowNumber = index + 1;
    const { data, reason } = validateImportedStudentRow(rawRows[index]);

    if (!data) {
      const rowResult: StudentImportRowResult = {
        row: rowNumber,
        cedula: "N/A",
        status: "error",
        reason,
      };

      summary.errors += 1;
      summary.results.push(rowResult);
      summary.downloadableRows.push({
        row: rowNumber,
        reason: reason || "Fila inválida",
      });
      continue;
    }

    normalizedRows.push({ row: rowNumber, data });
  }

  if (normalizedRows.length === 0) {
    return summary;
  }

  const uniqueCedulas = [...new Set(normalizedRows.map((item) => item.data.cedula))];
  const placeholders = uniqueCedulas.map(() => "?").join(", ");
  const existingCedulas = new Set<string>();

  if (placeholders.length > 0) {
    const existingRows = await turso.execute({
      sql: `SELECT cedula FROM students WHERE cedula IN (${placeholders})`,
      args: uniqueCedulas,
    });

    for (const row of existingRows.rows) {
      const value = (row as unknown as { cedula: string }).cedula;
      if (typeof value === "string") {
        existingCedulas.add(value);
      }
    }
  }

  const seenCedulas = new Set<string>();

  for (const row of normalizedRows) {
    const cedula = row.data.cedula;

    if (existingCedulas.has(cedula) || seenCedulas.has(cedula)) {
      const reason = "Cédula duplicada."
      summary.skipped += 1;
      summary.results.push({
        row: row.row,
        cedula,
        status: "skipped",
        reason,
      });
      summary.downloadableRows.push({
        ...row.data,
        row: row.row,
        reason,
      });
      continue;
    }

    seenCedulas.add(cedula);

    try {
      await createStudent(row.data);
      summary.created += 1;
      summary.results.push({
        row: row.row,
        cedula,
        status: "created",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "No se pudo crear el estudiante en la base de datos.";

      if (errorMessage.includes("UNIQUE") && errorMessage.includes("students.cedula")) {
        const reason = "Cédula duplicada."
        summary.skipped += 1;
        summary.results.push({
          row: row.row,
          cedula,
          status: "skipped",
          reason,
        });
        summary.downloadableRows.push({
          ...row.data,
          row: row.row,
          reason,
        });
      } else {
        summary.errors += 1;
        summary.results.push({
          row: row.row,
          cedula,
          status: "error",
          reason: errorMessage,
        });
        summary.downloadableRows.push({
          ...row.data,
          row: row.row,
          reason: errorMessage,
        });
      }
    }
  }

  return summary;
}

export async function updateStudentStatus(id: number, status: Student["status"]): Promise<Student | null> {
  const result = await turso.execute({
    sql: "UPDATE students SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *",
    args: [status, id],
  });
  return (result.rows[0] as unknown as Student) || null;
}

export async function deleteStudent(id: number): Promise<boolean> {
  const student = await getStudentById(id);
  if (student && student.course_id) {
    await turso.execute({
      sql: "UPDATE courses SET enrolled = enrolled - 1, updated_at = datetime('now') WHERE id = ?",
      args: [student.course_id],
    });
  }

  const result = await turso.execute({
    sql: "DELETE FROM students WHERE id = ?",
    args: [id],
  });
  return result.rowsAffected > 0;
}

export async function updateStudent(
  id: number,
  data: Partial<StudentFormData>
): Promise<Student | null> {
  const fields: string[] = [];
  const args: (string | number | null)[] = [];

  const allowedFields = [
    "first_name", "last_name", "age", "gender", "birth_date",
    "father_first_name", "father_last_name", "father_phone", "father_email",
    "mother_first_name", "mother_last_name", "mother_phone", "mother_email",
    "guardian_first_name", "guardian_last_name", "guardian_phone", "guardian_email",
    "email", "phone", "education_level", "previous_institution", "cedula"
  ] as const;

  for (const key of allowedFields) {
    if (key in data) {
      fields.push(`${key} = ?`);
      args.push((data as Record<string, unknown>)[key] as string | number | null);
    }
  }

  if (fields.length === 0) return getStudentById(id);

  fields.push("updated_at = datetime('now')");
  args.push(id);

  const result = await turso.execute({
    sql: `UPDATE students SET ${fields.join(", ")} WHERE id = ? RETURNING *`,
    args,
  });

  return (result.rows[0] as unknown as Student) || null;
}

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePin(length = 6): string {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[Math.floor(Math.random() * PIN_CHARS.length)];
  }
  return pin;
}

export async function setCorrectionPin(studentId: number): Promise<{ pin: string; expiresAt: number }> {
  const pin = generatePin(6);
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await turso.execute({
    sql: `UPDATE students SET verification_pin = ?, verification_pin_expires_at = ?, verification_pin_attempts = 0, correction_sent_at = ? WHERE id = ?`,
    args: [pin, expiresAt, Date.now(), studentId],
  });

  return { pin, expiresAt };
}

export async function verifyCorrectionPin(
  studentId: number,
  pin: string
): Promise<{ success: boolean; attemptsRemaining: number; locked: boolean }> {
  const student = await getStudentById(studentId);

  if (!student) {
    return { success: false, attemptsRemaining: 0, locked: true };
  }

  if (student.verification_pin_attempts >= 3) {
    return { success: false, attemptsRemaining: 0, locked: true };
  }

  if (!student.verification_pin || !student.verification_pin_expires_at) {
    return { success: false, attemptsRemaining: 3 - student.verification_pin_attempts, locked: false };
  }

  if (Date.now() > student.verification_pin_expires_at) {
    return { success: false, attemptsRemaining: 0, locked: true };
  }

  if (student.verification_pin !== pin) {
    const newAttempts = student.verification_pin_attempts + 1;
    await turso.execute({
      sql: `UPDATE students SET verification_pin_attempts = ? WHERE id = ?`,
      args: [newAttempts, studentId],
    });

    if (newAttempts >= 3) {
      return { success: false, attemptsRemaining: 0, locked: true };
    }

    return { success: false, attemptsRemaining: 3 - newAttempts, locked: false };
  }

  await turso.execute({
    sql: `UPDATE students SET verification_pin_attempts = 0 WHERE id = ?`,
    args: [studentId],
  });

  return { success: true, attemptsRemaining: 3, locked: false };
}

export async function clearCorrectionPin(studentId: number): Promise<void> {
  await turso.execute({
    sql: `UPDATE students SET verification_pin = NULL, verification_pin_expires_at = NULL, verification_pin_attempts = 0 WHERE id = ?`,
    args: [studentId],
  });
}

export async function getStudentForCorrection(studentId: number): Promise<Student | null> {
  return getStudentById(studentId);
}

// ============= SETTINGS =============

export async function getSettings(): Promise<Record<string, string>> {
  const result = await turso.execute("SELECT key, value FROM settings");
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    const r = row as unknown as Setting;
    settings[r.key] = r.value;
  }
  return settings;
}

export async function getSetting(key: string): Promise<string | null> {
  const result = await turso.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key],
  });
  const row = result.rows[0] as unknown as { value: string } | undefined;
  return row?.value || null;
}

export async function updateSetting(key: string, value: string): Promise<void> {
  await turso.execute({
    sql: "UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = ?",
    args: [value, key],
  });
}

// ============= USERS =============

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await turso.execute({
    sql: "SELECT * FROM users WHERE email = ? LIMIT 1",
    args: [email],
  });

  return (result.rows[0] as unknown as User) || null;
}

export async function updateUserLastLogin(id: number): Promise<void> {
  await turso.execute({
    sql: "UPDATE users SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
    args: [id],
  });
}

export async function getUsers(): Promise<UserSummary[]> {
  const result = await turso.execute(
    "SELECT id, email, name, role, active, created_at, updated_at, last_login_at FROM users ORDER BY created_at DESC"
  );

  return result.rows as unknown as UserSummary[];
}

export async function createUser(input: CreateUserInput): Promise<UserSummary> {
  const result = await turso.execute({
    sql: `
      INSERT INTO users (email, password_hash, name, role, active)
      VALUES (?, ?, ?, ?, ?)
      RETURNING id, email, name, role, active, created_at, updated_at, last_login_at
    `,
    args: [
      input.email.toLowerCase(),
      input.password_hash,
      input.name,
      input.role || "admin",
      input.active ?? 1,
    ],
  });

  return result.rows[0] as unknown as UserSummary;
}

export async function getUserById(id: number): Promise<UserSummary | null> {
  const result = await turso.execute({
    sql: `
      SELECT id, email, name, role, active, created_at, updated_at, last_login_at
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
    args: [id],
  });

  return (result.rows[0] as unknown as UserSummary) || null;
}

export async function updateUser(id: number, input: UpdateUserInput): Promise<UserSummary | null> {
  const fields: string[] = [];
  const args: (string | number)[] = [];

  if (input.email !== undefined) {
    fields.push("email = ?");
    args.push(input.email.toLowerCase());
  }

  if (input.password_hash !== undefined) {
    fields.push("password_hash = ?");
    args.push(input.password_hash);
  }

  if (input.name !== undefined) {
    fields.push("name = ?");
    args.push(input.name);
  }

  if (input.role !== undefined) {
    fields.push("role = ?");
    args.push(input.role);
  }

  if (input.active !== undefined) {
    fields.push("active = ?");
    args.push(input.active);
  }

  if (fields.length === 0) {
    return getUserById(id);
  }

  fields.push("updated_at = datetime('now')");
  args.push(id);

  const result = await turso.execute({
    sql: `
      UPDATE users
      SET ${fields.join(", ")}
      WHERE id = ?
      RETURNING id, email, name, role, active, created_at, updated_at, last_login_at
    `,
    args,
  });

  return (result.rows[0] as unknown as UserSummary) || null;
}

export async function deleteUser(id: number): Promise<boolean> {
  const result = await turso.execute({
    sql: "DELETE FROM users WHERE id = ?",
    args: [id],
  });

  return result.rowsAffected > 0;
}

// ============= DASHBOARD STATS =============

export async function getDashboardStats() {
  const [totalStudents, courseStats, statusStats, recentRegistrations] = await Promise.all([
    turso.execute("SELECT COUNT(*) as count FROM students"),
    turso.execute(`
      SELECT c.name, c.capacity, c.enrolled, 
             ROUND((c.enrolled * 100.0 / c.capacity), 1) as fill_rate
      FROM courses c 
      ORDER BY c.enrolled DESC
    `),
    turso.execute(`
      SELECT status, COUNT(*) as count 
      FROM students 
      GROUP BY status
    `),
    turso.execute(`
      SELECT DATE(created_at) as date, COUNT(*) as count 
      FROM students 
      GROUP BY DATE(created_at) 
      ORDER BY date DESC 
      LIMIT 7
    `),
  ]);

  return {
    totalStudents: (totalStudents.rows[0] as unknown as { count: number }).count,
    courseStats: courseStats.rows as unknown as Array<{
      name: string;
      capacity: number;
      enrolled: number;
      fill_rate: number;
    }>,
    statusStats: statusStats.rows as unknown as Array<{
      status: string;
      count: number;
    }>,
    recentRegistrations: recentRegistrations.rows as unknown as Array<{
      date: string;
      count: number;
    }>,
  };
}
