export interface Course {
  id: number;
  name: string;
  family: string | null;
  description: string;
  duration: string;
  schedule: string;
  capacity: number;
  enrolled: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  cedula: string;
  age: number | null;
  gender: string | null;
  birth_date: string;
  father_first_name: string | null;
  father_last_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  mother_first_name: string | null;
  mother_last_name: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  email: string;
  phone: string;
  education_level: string;
  previous_institution: string;
  course_id: number | null;
  course_name?: string;
  status: "pending" | "in_review" | "accepted" | "rejected";
  notes: string;
  verification_pin: string | null;
  verification_pin_expires_at: number | null;
  verification_pin_attempts: number;
  correction_sent_at: number | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: "admin";
  active: number;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export type UserSummary = Omit<User, "password_hash">;

export interface CreateUserInput {
  email: string;
  password_hash: string;
  name: string;
  role?: User["role"];
  active?: number;
}

export interface UpdateUserInput {
  email?: string;
  password_hash?: string;
  name?: string;
  role?: User["role"];
  active?: number;
}

export type StudentFormData = Omit<Student, "id" | "updated_at" | "course_name" | "status" | "notes">;
