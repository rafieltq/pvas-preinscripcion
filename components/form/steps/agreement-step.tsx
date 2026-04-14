"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface AgreementStepProps {
  onNext: () => void
}

export function AgreementStep({ onNext }: AgreementStepProps) {
  const { formData, updateFormData } = useFormContext()

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-justify">
        En el Politécnico Vicente Aquilino Santos creemos firmemente que la educación técnica es una inversión para el futuro de nuestros jóvenes. Hoy más que nunca, el acceso a herramientas tecnológicas se ha convertido en una parte esencial del proceso de aprendizaje, especialmente en áreas como Desarrollo de Software  -  Informática, Contabilidad, y demás especialidades técnicas que impartimos.
        <br/>
        <br/>
        Contar con un equipo informático propio, como una laptop, permite al estudiante practicar, investigar, desarrollar proyectos, realizar tareas con mayor calidad y aprovechar al máximo las oportunidades que ofrece la formación técnica. En el área de Desarrollo de Software, por ejemplo, el uso constante de la computadora es fundamental para programar, diseñar, probar aplicaciones y fortalecer habilidades que serán clave para su vida profesional. De igual manera, en las demás áreas técnicas, el uso de la tecnología apoya el aprendizaje, la organización y el desarrollo de competencias digitales indispensables en el mundo actual.
      </p>

      <div className="flex items-start gap-3 rounded-md border p-4">
        <Checkbox
          id="hasAcceptedAgreement"
          checked={formData.hasAcceptedAgreement}
          onCheckedChange={(checked) => updateFormData({ hasAcceptedAgreement: checked === true })}
        />
        <Label htmlFor="hasAcceptedAgreement" className="cursor-pointer leading-relaxed">
          He leido la información
        </Label>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={onNext} disabled={!formData.hasAcceptedAgreement}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
