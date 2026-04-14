# Preinscripcion

Aplicacion Next.js para gestionar pre-inscripciones estudiantiles y administracion interna.

## Comandos

- Instalar dependencias: `pnpm install`
- Desarrollo: `pnpm dev`
- Lint: `pnpm lint`
- Build: `pnpm build`
- Produccion: `pnpm start`

## Admin Authentication Setup

El panel administrativo esta protegido en `/admin/login` usando una sesion con cookie firmada.

### Variables de entorno requeridas

```bash
TURSO_DATABASE_URL=...
TURSO_AUTH_TOKEN=...

AUTH_SECRET=your-long-random-secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD_HASH=sha256:...
ADMIN_NAME=Administrator
```

### Generar hash de la contrasena de admin

```bash
node scripts/generate-admin-hash.js "your-admin-password"
```

Copie la salida y peguela en `ADMIN_PASSWORD_HASH`.

### Inicializar o actualizar base de datos

```bash
node scripts/setup-database.js
```

Este script crea/actualiza tablas requeridas (incluyendo `users`) y registra el administrador inicial usando `ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`.

### Flujo de autenticacion

- Login administrativo: `/admin/login`
- Rutas protegidas: `/admin/*` (excepto login)
- Estrategia de sesion: cookie firmada sin tabla de sesiones
- `GET /api/courses` se mantiene publico:
  - no autenticado: solo carreras activas
  - autenticado admin: lista completa
# pvas-preinscripcion
