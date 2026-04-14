import "dotenv/config";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function setupDatabase() {
  console.log("Setting up database tables...");

  if (!process.env.ADMIN_PASSWORD_HASH) {
    throw new Error("Missing ADMIN_PASSWORD_HASH env variable");
  }

  if (!process.env.ADMIN_EMAIL) {
    throw new Error("Missing ADMIN_EMAIL env variable");
  }

  // Create courses table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      duration TEXT,
      schedule TEXT,
      capacity INTEGER DEFAULT 30,
      enrolled INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("Created courses table");

  // Create students table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      cedula TEXT UNIQUE NOT NULL,
      father_first_name TEXT,
      father_last_name TEXT,
      father_phone TEXT,
      mother_first_name TEXT,
      mother_last_name TEXT,
      mother_phone TEXT,
      guardian_first_name TEXT,
      guardian_last_name TEXT,
      guardian_phone TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      birth_date TEXT,
      address TEXT,
      city TEXT,
      province TEXT,
      education_level TEXT,
      previous_institution TEXT,
      course_id INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);
  console.log("Created students table");

  // Create settings table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("Created settings table");

  // Create users table
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'admin',
      active INTEGER DEFAULT 1,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  console.log("Created users table");

  // Insert default settings
  await client.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('inscription_open', 'true'),
    ('inscription_start_date', '2026-01-01'),
    ('inscription_end_date', '2026-12-31'),
    ('institution_name', 'Politécnico Vicente Aquilino Santos'),
    ('contact_email', 'inscripciones@pvas.edu.do'),
    ('contact_phone', '809-555-0100'),
    ('contact_address', 'Santo Domingo, República Dominicana')
  `);
  console.log("Inserted default settings");

  // Insert default admin user
  await client.execute({
    sql: `
      INSERT OR IGNORE INTO users (email, password_hash, name, role, active)
      VALUES (?, ?, ?, 'admin', 1)
    `,
    args: [
      process.env.ADMIN_EMAIL.toLowerCase(),
      process.env.ADMIN_PASSWORD_HASH,
      process.env.ADMIN_NAME || "Administrator",
    ],
  });
  console.log("Inserted default admin user");

  // Insert sample courses
  await client.execute(`
    INSERT OR IGNORE INTO courses (id, name, description, duration, schedule, capacity) VALUES 
    (1, 'Técnico en Informática', 'Formación técnica en sistemas informáticos, redes y programación básica.', '2 años', 'Lunes a Viernes 8:00 AM - 12:00 PM', 35),
    (2, 'Técnico en Electricidad', 'Capacitación en instalaciones eléctricas residenciales e industriales.', '2 años', 'Lunes a Viernes 1:00 PM - 5:00 PM', 30),
    (3, 'Técnico en Mecánica Automotriz', 'Formación en diagnóstico y reparación de vehículos automotores.', '2 años', 'Lunes a Viernes 8:00 AM - 12:00 PM', 25),
    (4, 'Técnico en Contabilidad', 'Preparación en gestión contable y financiera empresarial.', '2 años', 'Lunes a Viernes 1:00 PM - 5:00 PM', 40),
    (5, 'Técnico en Enfermería', 'Formación en cuidados de salud y asistencia médica.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30)
  `);
  console.log("Inserted sample courses");

  console.log("Database setup complete!");
}

setupDatabase().catch(console.error);
