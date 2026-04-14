"use client"

import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

interface SuccessStepProps {
  onReset: () => void
}

export function SuccessStep({ onReset }: SuccessStepProps) {
  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-primary/10 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Solicitud Enviada Exitosamente
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Su pre-inscripción ha sido recibida. Nos pondremos en contacto con usted
          pronto para confirmar los próximos pasos del proceso de admisión.
        </p>
      </div>

      <div className="bg-muted/50 p-4 max-w-md mx-auto">
        <h3 className="font-semibold mb-2">Próximos Pasos:</h3>
        <ol className="text-sm text-left space-y-2 text-muted-foreground">
          <li>1. Recibirá un correo de confirmación</li>
          <li>2. Prepare los documentos requeridos</li>
          <li>3. Espere nuestra llamada para agendar una cita</li>
          <li>4. Visite el politécnico para formalizar su inscripción</li>
        </ol>
      </div>

      <Button onClick={onReset} variant="outline">
        Nueva Pre-Inscripción
      </Button>
    </div>
  )
}
