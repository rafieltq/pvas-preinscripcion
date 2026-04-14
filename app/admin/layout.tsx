"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <main className="flex-1 min-h-screen bg-background p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
