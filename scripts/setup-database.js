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
      family TEXT,
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
      age INTEGER,
      gender TEXT,
      birth_date TEXT,
      father_first_name TEXT,
      father_last_name TEXT,
      father_phone TEXT,
      father_email TEXT,
      mother_first_name TEXT,
      mother_last_name TEXT,
      mother_phone TEXT,
      mother_email TEXT,
      guardian_first_name TEXT,
      guardian_last_name TEXT,
      guardian_phone TEXT,
      guardian_email TEXT,
      email TEXT NOT NULL,
      phone TEXT,
      education_level TEXT,
      previous_institution TEXT,
      course_id INTEGER,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      verification_pin TEXT,
      verification_pin_expires_at INTEGER,
      verification_pin_attempts INTEGER DEFAULT 0,
      correction_sent_at INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (course_id) REFERENCES courses(id)
    )
  `);
  console.log("Created students table");

  // Add correction link columns if they don't exist (for existing databases)
  try {
    await client.execute(`ALTER TABLE students ADD COLUMN verification_pin TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE students ADD COLUMN verification_pin_expires_at INTEGER`);
  } catch (e) {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE students ADD COLUMN verification_pin_attempts INTEGER DEFAULT 0`);
  } catch (e) {
    // Column already exists
  }
  try {
    await client.execute(`ALTER TABLE students ADD COLUMN correction_sent_at INTEGER`);
  } catch (e) {
    // Column already exists
  }

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
    INSERT OR IGNORE INTO courses (id, name, family, description, duration, schedule, capacity) VALUES 
    (1, 'Instalaciones Eléctricas', 'Electricidad y Electrónica', 'Formación en instalación y mantenimiento de sistemas eléctricos.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30),
    (2, 'Muebles y Estructura De Madera', 'Madera y Muebles', 'Fabricación y diseño de muebles y estructuras de madera.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 25),
    (3, 'Electromecánica de Vehículos', 'Fabricación, Instalación', 'Diagnóstico y reparación de sistemas electromecánicos vehiculares.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 25),
    (4, 'Gestión Administrativa y Tributaria', 'Administración y Comercio', 'Formación en administración y gestión tributaria.', '2 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 35),
    (5, 'Desarrollo y Administración De Aplicaciones', 'Informática y Comunicaciones', 'Desarrollo de software y administración de aplicaciones informáticas.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30),
    (6, 'Refrigeración y Acondicionamiento de Aire', 'Electricidad y Electrónica', 'Instalación y mantenimiento de sistemas de refrigeración y climatización.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 25),
    (7, 'Soporte De Redes y Sistemas', 'Informática y Comunicaciones', 'Soporte técnico y administración de redes y sistemas.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30),
    (8, 'GESTIÓN DE INFRAESTRUCTURA DE REDES Y SISTEMAS INFORMÁTICOS', 'Informática y Comunicaciones', 'Gestión de infraestructura tecnológica y sistemas informáticos.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30),
    (9, 'DISEÑO Y DESARROLLO DE APLICACIONES INFORMÁTICAS', 'Informática y Comunicaciones', 'Diseño y desarrollo de aplicaciones informáticas.', '3 años', 'Lunes a Viernes 8:00 AM - 2:00 PM', 30)
  `);
  console.log("Inserted sample courses");

  console.log("Database setup complete!");
}

setupDatabase().catch(console.error);
