# JOM Preuniversitario

Portal de tareas, calificaciones y avisos para los alumnos del curso de
preparación preuniversitaria (Química, Física y Matemáticas). Cada persona
entra con su propio usuario y contraseña y ve solo lo que le corresponde
según su rol:

- **Docente** (tú, super administradora): crea tareas (con archivos
  adjuntos) y calificaciones, y crea las cuentas de los alumnos.
- **Directora**: acceso de solo lectura al rendimiento, tareas y
  calificaciones de todos los alumnos.
- **Alumno**: ve sus propias tareas (con sus adjuntos) y calificaciones.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com/) para autenticación, base de datos (Postgres),
  permisos por fila (Row Level Security) y Storage (adjuntos de tareas)
- Desplegado en [Vercel](https://vercel.com/) (proyecto `jom-preuniversitario`,
  ya conectado a este repositorio)

## 1. Crear el proyecto de Supabase

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) y crea un
   proyecto nuevo (elige una región cercana, por ejemplo US East).
2. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key (o `publishable` en el sistema nuevo de keys)
   - `service_role` key (o `secret`; es secreta, no la compartas ni la subas a GitHub)
3. Ve a **SQL Editor**, y ejecuta en orden el contenido completo de cada
   archivo en [`supabase/migrations`](./supabase/migrations):
   1. `0001_init.sql` — tablas `profiles`, `materias`, `tareas`,
      `evaluaciones`, permisos por rol y siembra de las 3 materias.
   2. `0002_calificaciones.sql` — renombra `evaluaciones` a `calificaciones`
      y permite vincular una calificación a una tarea existente.
   3. `0003_tarea_archivos.sql` — tabla `tarea_archivos` y bucket de Storage
      `tareas-adjuntos` para los archivos/imágenes que subas en las tareas.

   Si el proyecto es nuevo y aún no habías corrido ninguna migración, igual
   corre las tres en ese orden (cada una depende de la anterior).

## 2. Crear tu cuenta (docente) y la de las directoras

No hay registro público: las cuentas de staff se crean a mano en Supabase la
primera vez, y luego tú creas las cuentas de los alumnos desde el portal.

1. En Supabase, ve a **Authentication → Users → Add user → Create new user**.
   Crea tu cuenta con tu correo y una contraseña. Repite para cada directora.
2. Ve a **Table Editor → profiles**. Busca tu fila (se creó automáticamente) y
   cambia la columna `role` de `alumno` a `docente`. Para las directoras,
   cámbialo a `directora`.
3. Ya puedes iniciar sesión en `/login` con esas credenciales.

## 3. Variables de entorno

Copia `.env.example` a `.env.local` y llena los tres valores del paso 1:

```bash
cp .env.example .env.local
```

En Vercel (el proyecto ya está conectado a este repo): **Project → Settings →
Environment Variables**, agrega las mismas tres variables para Production y
Preview, y vuelve a desplegar.

## 4. Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) — te redirige a `/login`.

## 5. Crear alumnos

Una vez que inicias sesión como docente: **Alumnos → Nuevo alumno**. Se crea su
cuenta al instante (correo + contraseña) y el portal te muestra esos datos una
sola vez para que se los compartas.

## Estructura

```
src/
  app/
    login/                    Inicio de sesión
    portal/
      tareas/                  Lista + creación de tareas, con adjuntos (todos ven, solo docente crea)
      calificaciones/           Notas de tareas y evaluaciones (alumno ve lo propio, staff ve todo)
      alumnos/                  Roster y detalle por alumno (staff), alta de alumnos (docente)
  lib/
    supabase/                  Clientes de Supabase (browser, server, middleware, admin)
    storage.ts                 Helpers de Supabase Storage (bucket de adjuntos)
    auth.ts                    Helpers de sesión/rol para Server Components
supabase/
  migrations/
    0001_init.sql               Esquema inicial, RLS y datos semilla
    0002_calificaciones.sql     Renombra evaluaciones→calificaciones, vínculo a tareas
    0003_tarea_archivos.sql     Adjuntos de tareas (tabla + bucket de Storage)
```

## Qué falta (próximas iteraciones)

- Sección de **Avisos** y **Recursos** generales (videos, PDFs, presentaciones
  fuera del contexto de una tarea puntual).
- Edición de tareas/calificaciones ya creadas (hoy: crear y eliminar).
- Registro de "entrega" de tarea por alumno (hoy las tareas son informativas
  para todo el grupo, sin marcar completado individual).
- Exámenes interactivos con autocalificación (en diseño).
