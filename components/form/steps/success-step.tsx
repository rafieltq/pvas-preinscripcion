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
      </div>
    </div>
  )
}
