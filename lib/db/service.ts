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
  course: Pick<Course, "name" | "description" | "duration" | "schedule" | "capacity" | "active">
): Promise<Course> {
  const result = await turso.execute({
    sql: "INSERT INTO courses (name, description, duration, schedule, capacity, active) VALUES (?, ?, ?, ?, ?, ?) RETURNING *",
    args: [course.name, course.description, course.duration, course.schedule, course.capacity, course.active],
  });
  return result.rows[0] as unknown as Course;
}

export async function updateCourse(
  id: number,
  course: Partial<Pick<Course, "name" | "description" | "duration" | "schedule" | "capacity" | "active">>
): Promise<Course | null> {
  const fields: string[] = [];
  const args: (string | number)[] = [];

  if (course.name !== undefined) {
    fields.push("name = ?");
    args.push(course.name);
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
  const result = await turso.execute({
    sql: `INSERT INTO students (
      first_name, last_name, cedula, father_first_name, father_last_name, father_phone,
      mother_first_name, mother_last_name, mother_phone, guardian_first_name, guardian_last_name,
      guardian_phone, email, phone, birth_date,
      address, city, province, education_level, previous_institution, course_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    args: [
      student.first_name,
      student.last_name,
      student.cedula,
      student.father_first_name,
      student.father_last_name,
      student.father_phone,
      student.mother_first_name,
      student.mother_last_name,
      student.mother_phone,
      student.guardian_first_name,
      student.guardian_last_name,
      student.guardian_phone,
      student.email,
      student.phone,
      student.birth_date,
      student.address,
      student.city,
      student.province,
      student.education_level,
      student.previous_institution,
      student.course_id,
    ],
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

export async function updateStudentStatus(id: number, status: Student["status"]): Promise<Student | null> {
  const result = await turso.execute({
    sql: "UPDATE students SET status = ?, updated_at = datetime('now') WHERE id = ? RETURNING *",
    args: [status, id],
  });
  return (result.rows[0] as unknown as Student) || null;
}

export async function deleteStudent(id: number): Promise<boolean> {
  // Get student to decrement course count
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
      WHERE c.active = 1 
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
