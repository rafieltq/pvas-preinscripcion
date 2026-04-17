import nodemailer from "nodemailer";
import type { Student } from "@/lib/db/types";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function sendCorrectionEmail(
  student: Student,
  pin: string,
  expiresAt: number
): Promise<{ success: boolean; error?: string }> {
  const correctionUrl = `${BASE_URL}/correction/${student.id}`;

  const ccEmails: string[] = [];
  if (student.father_email) ccEmails.push(student.father_email);
  if (student.mother_email) ccEmails.push(student.mother_email);
  if (student.guardian_email) ccEmails.push(student.guardian_email);

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enlace para corrección de datos</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="background-color: #1e40af; padding: 24px; text-align: center;">
        <img src="${BASE_URL}/logo.webp" alt="Politécnico Vicente Aquilino Santos" style="max-width: 120px; height: auto; margin-bottom: 12px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Politécnico Vicente Aquilino Santos</h1>
        <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Sistema de Pre-inscripciones</p>
      </div>

      <div style="padding: 32px;">
        <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 18px;">Hola, ${student.first_name} ${student.last_name}</h2>

        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          Hemos recibido una solicitud para corregir sus datos de pre-inscripción en el Politécnico Vicente Aquilino Santos.
        </p>

        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          Utilice el siguiente código PIN para verificar su identidad:
        </p>

        <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 8px; text-transform: uppercase;">Código de Verificación</p>
          <p style="color: #1e40af; font-size: 32px; font-weight: bold; margin: 0; letter-spacing: 8px;">${pin}</p>
        </div>

        <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
          <strong>Enlace para corrección:</strong><br>
          <a href="${correctionUrl}" style="color: #3b82f6; text-decoration: none; word-break: break-all;">${correctionUrl}</a>
        </p>

        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin-bottom: 24px;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            <strong>Importante:</strong> Este código expire el <strong>${formatDate(expiresAt)}</strong>. Después de 3 intentos fallidos, deberá contactar a la institución para solicitar un nuevo enlace.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0;">
          Si no solicitó este cambio, puede ignorar este correo. No comparta este código con nadie.
        </p>
      </div>

      <div style="background-color: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
          Politécnico Vicente Aquilino Santos<br>
          Departamento de Pre-inscripciones<br>
          <a href="mailto:inscripciones@pvas.edu.do" style="color: #3b82f6;">inscripciones@pvas.edu.do</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const textContent = `
Politécnico Vicente Aquilino Santos - Sistema de Pre-inscripciones

Hola, ${student.first_name} ${student.last_name}

Hemos recibido una solicitud para corregir sus datos de pre-inscripción.

Su código de verificación es: ${pin}

Enlace para corrección: ${correctionUrl}

Este código expira el ${formatDate(expiresAt)}.

Si no solicitó este cambio, puede ignorar este correo.
  `.trim();

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Pre-inscripciones" <${process.env.SMTP_USER}>`,
      to: student.email,
      cc: ccEmails.length > 0 ? ccEmails.join(", ") : undefined,
      subject: "Enlace para corrección de datos - Politécnico Vicente Aquilino Santos",
      text: textContent,
      html: htmlContent,
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending correction email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error al enviar el correo",
    };
  }
}
