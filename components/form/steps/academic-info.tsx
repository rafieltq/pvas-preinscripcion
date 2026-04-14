"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AcademicInfoStepProps {
  onNext: () => void
  onBack: () => void
}

export function AcademicInfoStep({ onNext, onBack }: AcademicInfoStepProps) {
  const { formData, updateFormData } = useFormContext()
  const isValid = formData.previous_institution.trim().length > 0

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="previous_institution">Escuela / Colegio Anterior *</Label>
        <Input
          id="previous_institution"
          value={formData.previous_institution}
          onChange={(e) => updateFormData({ previous_institution: e.target.value })}
          placeholder="Nombre de la institución"
        />
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
