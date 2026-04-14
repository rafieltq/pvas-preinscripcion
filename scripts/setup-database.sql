-- Pre-Inscription System Database Schema
-- Politécnico Vicente Aquilino Santos

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  quota INTEGER NOT NULL DEFAULT 30,
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombres TEXT NOT NULL,
  apellidos TEXT NOT NULL,
  telefono TEXT NOT NULL,
  edad INTEGER NOT NULL,
  genero TEXT NOT NULL CHECK (genero IN ('masculino', 'femenino', 'otro')),
  fecha_nacimiento DATE NOT NULL,
  centro_escolar_anterior TEXT NOT NULL,
  correo_tutor TEXT NOT NULL,
  nombre_tutor TEXT NOT NULL,
  telefono_tutor TEXT NOT NULL,
  course_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Form settings table (single row for global settings)
CREATE TABLE IF NOT EXISTS form_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  is_form_enabled BOOLEAN NOT NULL DEFAULT 0,
  form_title TEXT NOT NULL DEFAULT 'Pre-Inscripción',
  form_description TEXT NOT NULL DEFAULT 'Complete el formulario para pre-inscribirse en una carrera técnica.',
  terms_and_conditions TEXT NOT NULL DEFAULT 'Al enviar este formulario, acepto los términos y condiciones del proceso de pre-inscripción.',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default form settings
INSERT OR IGNORE INTO form_settings (id, is_form_enabled, form_title, form_description, terms_and_conditions)
VALUES (1, 0, 'Pre-Inscripción', 'Complete el formulario para pre-inscribirse en una carrera técnica del Politécnico Vicente Aquilino Santos.', 'Al enviar este formulario, acepto los términos y condiciones del proceso de pre-inscripción. Los datos proporcionados serán utilizados únicamente para fines administrativos y académicos.');

-- Insert sample courses
INSERT OR IGNORE INTO courses (id, name, description, quota, is_active) VALUES
(1, 'Desarrollo de Software', 'Aprende a diseñar, desarrollar y mantener aplicaciones de software utilizando las tecnologías más demandadas del mercado.', 35, 1),
(2, 'Redes y Telecomunicaciones', 'Especialízate en el diseño, implementación y administración de redes de comunicación y sistemas de telecomunicaciones.', 30, 1),
(3, 'Electrónica Industrial', 'Domina los sistemas electrónicos aplicados a la industria, automatización y control de procesos.', 25, 1),
(4, 'Mecatrónica', 'Combina mecánica, electrónica e informática para diseñar y mantener sistemas automatizados inteligentes.', 25, 1),
(5, 'Contabilidad Computarizada', 'Desarrolla habilidades en contabilidad moderna con el uso de software especializado y herramientas digitales.', 40, 1);

-- Triggers to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_courses_timestamp 
AFTER UPDATE ON courses
BEGIN
  UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_students_timestamp 
AFTER UPDATE ON students
BEGIN
  UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_form_settings_timestamp 
AFTER UPDATE ON form_settings
BEGIN
  UPDATE form_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger to increment enrolled_count when a student is inserted
CREATE TRIGGER IF NOT EXISTS increment_enrolled_count
AFTER INSERT ON students
BEGIN
  UPDATE courses SET enrolled_count = enrolled_count + 1 WHERE id = NEW.course_id;
END;

-- Trigger to decrement enrolled_count when a student is deleted
CREATE TRIGGER IF NOT EXISTS decrement_enrolled_count
AFTER DELETE ON students
BEGIN
  UPDATE courses SET enrolled_count = enrolled_count - 1 WHERE id = OLD.course_id;
END;
