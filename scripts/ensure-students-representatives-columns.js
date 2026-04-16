import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const expectedColumns = [
  "father_first_name",
  "father_last_name",
  "father_phone",
  "mother_first_name",
  "mother_last_name",
  "mother_phone",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
];

async function ensureStudentsRepresentativeColumns() {
  const result = await client.execute("PRAGMA table_info(students)");
  const existingColumns = new Set(
    result.rows
      .map((row) => {
        if (!row || typeof row !== "object") {
          return null;
        }

        const name = row.name;
        return typeof name === "string" ? name : null;
      })
      .filter(Boolean)
  );

  const missingColumns = expectedColumns.filter((column) => !existingColumns.has(column));

  if (missingColumns.length === 0) {
    console.log("students table already has all representative columns.");
    return;
  }

  console.log(`Missing columns detected: ${missingColumns.join(", ")}`);

  for (const column of missingColumns) {
    await client.execute(`ALTER TABLE students ADD COLUMN ${column} TEXT`);
    console.log(`Added column: ${column}`);
  }

  console.log("Representative columns ensured successfully.");
}

ensureStudentsRepresentativeColumns().catch((error) => {
  console.error("Failed to ensure students representative columns:", error);
  process.exitCode = 1;
});
