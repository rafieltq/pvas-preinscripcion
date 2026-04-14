"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, Trash2, UserX, UserCheck } from "lucide-react"
import type { UserSummary } from "@/lib/db/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface SessionResponse {
  authenticated: boolean
  user: {
    id: number
    email: string
    role: string
  }
}

export default function AdminUsersPage() {
  const { data: users, mutate } = useSWR<UserSummary[]>("/api/users", fetcher)
  const { data: session } = useSWR<SessionResponse>("/api/auth/session", fetcher)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [actionUserId, setActionUserId] = useState<number | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editName, setEditName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const resetForm = () => {
    setName("")
    setEmail("")
    setPassword("")
  }

  const startEditUser = (user: UserSummary) => {
    setEditingUserId(user.id)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditPassword("")
    setError(null)
    setSuccess(null)
  }

  const cancelEditUser = () => {
    setEditingUserId(null)
    setEditName("")
    setEditEmail("")
    setEditPassword("")
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error || "No se pudo crear el usuario")
        return
      }

      resetForm()
      setSuccess("Usuario creado correctamente")
      mutate()
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveUser = async (userId: number) => {
    setActionUserId(userId)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error || "No se pudo editar el usuario")
        return
      }

      setSuccess("Usuario actualizado correctamente")
      cancelEditUser()
      mutate()
    } finally {
      setActionUserId(null)
    }
  }

  const handleToggleActive = async (user: UserSummary) => {
    if (session?.user.id === user.id && user.active === 1) {
      setError("No puedes desactivar tu propio usuario")
      return
    }

    const nextActive = user.active === 1 ? 0 : 1
    const confirmed = confirm(
      nextActive === 0
        ? `¿Desactivar el usuario ${user.email}?`
        : `¿Activar el usuario ${user.email}?`
    )

    if (!confirmed) return

    setActionUserId(user.id)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: nextActive }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error || "No se pudo actualizar el estado del usuario")
        return
      }

      setSuccess(nextActive === 1 ? "Usuario activado" : "Usuario desactivado")
      mutate()
    } finally {
      setActionUserId(null)
    }
  }

  const handleDeleteUser = async (user: UserSummary) => {
    if (session?.user.id === user.id) {
      setError("No puedes eliminar tu propio usuario")
      return
    }

    const confirmed = confirm(`¿Eliminar definitivamente el usuario ${user.email}?`)
    if (!confirmed) return

    setActionUserId(user.id)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data?.error || "No se pudo eliminar el usuario")
        return
      }

      setSuccess("Usuario eliminado correctamente")
      if (editingUserId === user.id) {
        cancelEditUser()
      }
      mutate()
    } finally {
      setActionUserId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
        <p className="text-muted-foreground">Crear y gestionar accesos del backoffice</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear Usuario</CardTitle>
          <CardDescription>El nuevo usuario podrá iniciar sesión en el panel administrativo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="email">Correo *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@pvas.edu.do"
                required
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 8 caracteres"
                required
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <Button className="w-full" type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>{users?.length || 0} usuarios en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ultimo acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {editingUserId === user.id ? (
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre"
                      />
                    ) : (
                      user.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingUserId === user.id ? (
                      <Input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="usuario@pvas.edu.do"
                      />
                    ) : (
                      user.email
                    )}
                  </TableCell>
                  <TableCell className="uppercase text-xs tracking-wide">{user.role}</TableCell>
                  <TableCell>
                    <Badge className={user.active === 1 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {user.active === 1 ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.last_login_at
                      ? new Date(user.last_login_at).toLocaleString("es-DO")
                      : "Nunca"}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingUserId === user.id ? (
                      <div className="flex justify-end gap-2">
                        <Input
                          type="password"
                          minLength={8}
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Nueva contraseña (opcional)"
                          className="max-w-[240px]"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveUser(user.id)}
                          disabled={actionUserId === user.id}
                        >
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditUser}>
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditUser(user)}
                          disabled={actionUserId === user.id}
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                          disabled={actionUserId === user.id}
                        >
                          {user.active === 1 ? (
                            <>
                              <UserX className="mr-1 h-4 w-4" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-1 h-4 w-4" />
                              Activar
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          disabled={actionUserId === user.id}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(!users || users.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No hay usuarios registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
