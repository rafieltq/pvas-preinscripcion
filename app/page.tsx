import { FormProvider } from "@/lib/form-context"
import { PreInscriptionForm } from "@/components/form/pre-inscription-form"
import { BookOpenCheck, GraduationCap } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold">Politécnico Vicente Aquilino Santos</h1>
                <p className="text-sm text-primary-foreground/80">Sistema de Pre-Inscripción</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Administración
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <FormProvider>
          <PreInscriptionForm />
        </FormProvider>
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Politécnico Vicente Aquilino Santos. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
