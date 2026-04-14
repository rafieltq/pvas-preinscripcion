export interface Course {
  id: number;
  name: string;
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
  father_first_name: string | null;
  father_last_name: string | null;
  father_phone: string | null;
  mother_first_name: string | null;
  mother_last_name: string | null;
  mother_phone: string | null;
  guardian_first_name: string | null;
  guardian_last_name: string | null;
  guardian_phone: string | null;
  email: string;
  phone: string;
  birth_date: string;
  address: string;
  city: string;
  province: string;
  education_level: string;
  previous_institution: string;
  course_id: number | null;
  course_name?: string;
  status: "pending" | "in_review" | "accepted" | "rejected";
  notes: string;
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

export type StudentFormData = Omit<Student, "id" | "created_at" | "updated_at" | "course_name" | "status" | "notes">;
