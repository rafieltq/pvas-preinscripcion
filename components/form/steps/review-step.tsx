"use client"

import { useState } from "react"
import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"

interface ReviewStepProps {
  onBack: () => void
  onSubmit: () => Promise<void>
}

export function ReviewStep({ onBack, onSubmit }: ReviewStepProps) {
  const { formData } = useFormContext()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit()
    } finally {
      setIsSubmitting(false)
    }
  }

  const documents = [
    { key: "hasIdCopy", label: "Copia de Cédula" },
    { key: "hasBirthCertificate", label: "Certificado de Nacimiento" },
    { key: "hasGrades", label: "Record de Notas" },
    { key: "hasPhoto", label: "Foto 2x2" },
  ] as const

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Por favor revise su información antes de enviar la solicitud.
      </p>

      <div className="space-y-4">
        <div className="bg-muted/50 p-4 space-y-2">
          <h3 className="font-semibold text-foreground">Información Personal</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Nombre:</span>
            <span>{formData.first_name} {formData.last_name}</span>
            <span className="text-muted-foreground">Cédula:</span>
            <span>{formData.cedula}</span>
            <span className="text-muted-foreground">Edad:</span>
            <span>{formData.age} años</span>
            <span className="text-muted-foreground">Género:</span>
            <span>{formData.gender === "M" ? "Masculino" : "Femenino"}</span>
            <span className="text-muted-foreground">Fecha de Nacimiento:</span>
            <span>{formData.birth_date}</span>
          </div>
        </div>

        <div className="bg-muted/50 p-4 space-y-2">
          <h3 className="font-semibold text-foreground">Información de Contacto</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Email:</span>
            <span>{formData.email}</span>
            <span className="text-muted-foreground">Teléfono:</span>
            <span>{formData.phone}</span>
          </div>
        </div>

        <div className="bg-muted/50 p-4 space-y-2">
          <h3 className="font-semibold text-foreground">Información Académica</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Institución Anterior:</span>
            <span>{formData.previous_institution}</span>
            <span className="text-muted-foreground">Carrera a cursar:</span>
            <span>{formData.course_name || "No especificada"}</span>
          </div>
        </div>

        <div className="bg-muted/50 p-4 space-y-2">
          <h3 className="font-semibold text-foreground">Documentos</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {documents.map((doc) => (
              <div key={doc.key} className="flex items-center gap-2 col-span-2">
                {formData[doc.key] ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : (
                  <X className="w-4 h-4 text-destructive" />
                )}
                <span>{doc.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Atrás
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Solicitud"
          )}
        </Button>
      </div>
    </div>
  )
}
