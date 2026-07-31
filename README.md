# JOM Preuniversitario

Portal de tareas, calificaciones y avisos para los alumnos del curso de
preparación preuniversitaria (Química, Física y Matemáticas). Cada persona
entra con su propio usuario y contraseña y ve solo lo que le corresponde
según su rol:

- **Docente** (tú, super administradora): crea tareas (con archivos
  adjuntos), calificaciones y exámenes interactivos, y crea las cuentas de
  los alumnos.
- **Directora**: acceso de solo lectura al rendimiento, tareas, exámenes y
  calificaciones de todos los alumnos.
- **Alumno**: ve sus propias tareas (con sus adjuntos), toma sus exámenes
  (con calificación automática) y ve sus calificaciones.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com/) para autenticación, base de datos (Postgres),
  permisos por fila (Row Level Security) y Storage (adjuntos de tareas)
- [Anthropic API](https://console.anthropic.com/) (Claude) para generar
  preguntas de examen a partir de un tema
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
   4. `0004_examenes.sql` — tablas `examenes`, `examen_preguntas` (solo
      legible por staff, guarda la respuesta correcta) y `examen_intentos`
      (el alumno solo puede leer los suyos; la calificación siempre se
      calcula en el servidor).
   5. `0005_recursos.sql` — tabla `recursos` (archivo o link, materia
      opcional), tabla `recurso_vistas` (registro de qué alumno ya vio cada
      recurso) y bucket de Storage `recursos-adjuntos`.

   Si el proyecto es nuevo y aún no habías corrido ninguna migración, igual
   corre las cinco en ese orden (cada una depende de la anterior).

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

La cuarta variable, `ANTHROPIC_API_KEY`, es tu API key de
[console.anthropic.com](https://console.anthropic.com/) — solo se usa para
generar preguntas de examen con IA; si la dejas vacía, el resto del portal
funciona igual (solo no podrás usar "Generar con IA" al crear un examen).

En Vercel (el proyecto ya está conectado a este repo): **Project → Settings →
Environment Variables**, agrega las mismas variables para Production y
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
      tareas/                  Lista + creación/edición de tareas, con adjuntos (todos ven, solo docente edita)
      examenes/                 Exámenes de opción múltiple con autocalificación (manual, IA, CSV)
      calificaciones/           Notas de tareas y evaluaciones, editables (alumno ve lo propio, staff ve todo)
      recursos/                  Archivos o links generales, con estatus de "visto" por alumno
      alumnos/                  Roster y detalle por alumno (staff), alta de alumnos (docente)
  components/
    examen-builder.tsx          Formulario de creación de examen (manual + IA + subir CSV)
    tomar-examen-form.tsx       Formulario del alumno para responder un examen
    recurso-form.tsx            Formulario de nuevo recurso (archivo o link)
  lib/
    supabase/                  Clientes de Supabase (browser, server, middleware, admin)
    storage.ts                 Helpers de Supabase Storage (buckets de adjuntos)
    anthropic.ts               Cliente de la API de Anthropic (generación de preguntas)
    csv.ts                      Parser de CSV sin dependencias (plantilla de examen)
    auth.ts                    Helpers de sesión/rol para Server Components
supabase/
  migrations/
    0001_init.sql               Esquema inicial, RLS y datos semilla
    0002_calificaciones.sql     Renombra evaluaciones→calificaciones, vínculo a tareas
    0003_tarea_archivos.sql     Adjuntos de tareas (tabla + bucket de Storage)
    0004_examenes.sql           Exámenes, preguntas y intentos (autocalificados en el servidor)
    0005_recursos.sql           Recursos (archivo/link) y seguimiento de "visto" por alumno
```

## Exámenes: cómo funciona la autocalificación

Los alumnos **nunca** reciben la respuesta correcta en el navegador: la
tabla `examen_preguntas` solo es legible por docente/directora (RLS), y el
alumno recibe las preguntas a través de un server action que usa la
`service_role` key para leerlas y les quita el campo `respuesta_correcta`
antes de responder. Al entregar el examen, otro server action (también con
`service_role`) recalcula la calificación comparando las respuestas contra
la base de datos y la guarda — el alumno no puede enviar su propia
calificación ni ver las respuestas correctas de antemano. Cada alumno solo
puede presentar un examen una vez.

Para subir preguntas en lote hay una plantilla CSV descargable desde el
botón "Plantilla CSV" en **Exámenes → Nuevo examen**, con columnas
`enunciado,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta` (la
respuesta correcta se indica con la letra A, B, C o D).

## Recursos: cómo funciona el "visto"

Cada recurso (archivo o link) se abre a través de la ruta
`/portal/recursos/[id]/abrir`, que primero registra en `recurso_vistas` que
ese alumno lo abrió (si aún no estaba registrado) y luego redirige al
archivo real (URL firmada de Storage) o al link externo. Así el registro de
"visto" no depende de que el alumno haga nada extra — basta con que le dé
clic al botón para abrirlo. Docente y directora ven, por cada recurso,
cuántos alumnos lo han visto y el detalle de quién y cuándo.

## Qué falta (próximas iteraciones)

- Sección de **Avisos** (anuncios de texto simples, separados de Recursos).
- Registro de "entrega" de tarea por alumno (hoy las tareas son informativas
  para todo el grupo, sin marcar completado individual).
- Preguntas de examen con respuesta abierta o numérica (hoy: solo opción
  múltiple, por confiabilidad de la autocalificación).
- Los resultados de exámenes viven en su propia sección; todavía no se
  fusionan con la vista de Calificaciones.
