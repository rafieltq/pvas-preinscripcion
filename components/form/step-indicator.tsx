"use client"

import {
  Check,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StepIndicatorProps {
  steps: string[]
  currentStep: number
}

const stepIcons: LucideIcon[] = [
  ClipboardCheck,
  User,
  Phone,
  GraduationCap,
  FileText,
  Check,
]

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="mb-8 overflow-x-auto overflow-y-visible px-1 pt-2 pb-2">
      <div className="mx-auto flex min-w-max items-start justify-center gap-2">
        {steps.map((step, index) => {
          const StepIcon = stepIcons[index] ?? FileText
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <div key={step} className="flex items-center" aria-current={isCurrent ? "step" : undefined}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-200",
                    isCompleted
                      ? "bg-secondary border-secondary text-secondary-foreground"
                      : isCurrent
                        ? "border-primary text-primary bg-background scale-105 ring-2 ring-primary/20"
                        : "border-muted-foreground/30 text-muted-foreground bg-background"
                  )}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : <StepIcon className="h-5 w-5" />}
                </div>
                <span
                  className={cn(
                    "mt-2 max-w-[88px] text-center text-xs",
                    index <= currentStep ? "font-medium text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 mt-5 h-0.5 w-12 transition-colors",
                    isCompleted ? "bg-secondary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
