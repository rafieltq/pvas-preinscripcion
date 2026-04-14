"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ContactInfoStepProps {
  onNext: () => void
  onBack: () => void
}

export function ContactInfoStep({ onNext, onBack }: ContactInfoStepProps) {
  const { formData, updateFormData } = useFormContext()

  const isValid = formData.email && formData.phone && formData.address && formData.city && formData.province

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="juan@ejemplo.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="809-000-0000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => updateFormData({ address: e.target.value })}
          placeholder="Calle Principal #123"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad / Municipio *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            placeholder="Santo Domingo"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="province">Provincia *</Label>
          <Input
            id="province"
            value={formData.province}
            onChange={(e) => updateFormData({ province: e.target.value })}
            placeholder="Distrito Nacional"
          />
        </div>
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
