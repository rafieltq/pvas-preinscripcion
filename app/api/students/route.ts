import { NextResponse } from "next/server";
import { getStudents, createStudent } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";

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
    const body = await request.json();
    const student = await createStudent(body);
    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    console.error("Error creating student:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
