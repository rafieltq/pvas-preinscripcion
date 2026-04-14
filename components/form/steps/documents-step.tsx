"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface DocumentsStepProps {
  onNext: () => void
  onBack: () => void
}

export function DocumentsStep({ onNext, onBack }: DocumentsStepProps) {
  const { formData, updateFormData } = useFormContext()

  const documents = [
    { id: "hasIdCopy", label: "Copia de Cédula o Acta de Nacimiento" },
    { id: "hasBirthCertificate", label: "Certificado de Nacimiento" },
    { id: "hasGrades", label: "Record de Notas / Certificación de Estudios" },
    { id: "hasPhoto", label: "Foto 2x2 (fondo blanco)" },
  ] as const

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Marque los documentos que tiene disponibles. Estos documentos serán requeridos al momento
        de formalizar la inscripción.
      </p>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center gap-3">
            <Checkbox
              id={doc.id}
              checked={formData[doc.id]}
              onCheckedChange={(checked) =>
                updateFormData({ [doc.id]: checked === true })
              }
            />
            <Label htmlFor={doc.id} className="cursor-pointer">
              {doc.label}
            </Label>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onNext}>Revisar Solicitud</Button>
      </div>
    </div>
  )
}
