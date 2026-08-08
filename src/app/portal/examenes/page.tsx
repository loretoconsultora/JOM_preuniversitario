import Link from "next/link";
import { Plus, Trash2, GraduationCap, FileQuestion, Users, CalendarClock } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { materiasInscritas } from "@/lib/materias-inscritas";
import type { Examen, ExamenAlumno, ExamenIntento, Materia } from "@/types/database";
import { MateriaSelector } from "@/components/materia-selector";
import { ExtenderFechasExamenForm } from "@/components/extender-fechas-examen-form";
import { examenCerrado, examenAunNoAbre } from "@/lib/fecha-examen";
import { eliminarExamen } from "./actions";

function formatFecha(fecha: string | null, hora: string | null) {
  if (!fecha) return null;
  const fechaFmt = new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  if (!hora) return fechaFmt;
  const horaFmt = new Date(`${fecha}T${hora.slice(0, 5)}:00`).toLocaleTimeString("es-MX", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${fechaFmt}, ${horaFmt}`;
}

export default async function ExamenesPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const profile = await requireProfile();
  const { materia: materiaParam } = await searchParams;
  const supabase = await createClient();
  const isDocente = profile.role === "docente";
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const [{ data: materias }, { data: examenes }, { data: intentos }, alumnosCountResult, { data: examenAlumnos }] =
    await Promise.all([
      supabase.from("materias").select("*").order("nombre"),
      // RLS: el alumno solo ve los exámenes abiertos a todos o asignados a él.
      // Orden: de la próxima fecha de cierre a la última (sin fecha de
      // cierre al final), igual que Tareas.
      supabase
        .from("examenes")
        .select("*")
        .order("fecha_cierre", { ascending: true, nullsFirst: false })
        .order("hora_cierre", { ascending: true, nullsFirst: false }),
      // RLS: el alumno solo ve los suyos, docente/directora ven todos.
      supabase.from("examen_intentos").select("*"),
      isStaff
        ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "alumno")
        : Promise.resolve({ count: 0 }),
      isStaff ? supabase.from("examen_alumnos").select("*") : Promise.resolve({ data: [] }),
    ]);

  const materiasList = isDocente
    ? await materiasGestionables(supabase, profile.id)
    : profile.role === "alumno"
      ? await materiasInscritas(supabase, profile.id)
      : ((materias ?? []) as Materia[]);
  const materiaIds = new Set(materiasList.map((m) => m.id));

  // Para docente/directora, el historial se organiza por materia (menú
  // desplegable, igual que Asistencia/Tareas): muestra los exámenes de esa
  // materia dejados por cualquier docente, no solo los propios.
  const materiaSeleccionada =
    isStaff && materiasList.length > 0
      ? materiaParam && materiaIds.has(materiaParam)
        ? materiaParam
        : materiasList[0].id
      : null;

  const examenesList = ((examenes ?? []) as Examen[]).filter((e) =>
    materiaSeleccionada ? e.materia_id === materiaSeleccionada : materiaIds.has(e.materia_id)
  );
  const intentosList = (intentos ?? []) as ExamenIntento[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));
  const totalAlumnos = alumnosCountResult.count ?? 0;

  const destinatariosPorExamen = new Map<string, number>();
  for (const ea of (examenAlumnos ?? []) as ExamenAlumno[]) {
    destinatariosPorExamen.set(ea.examen_id, (destinatariosPorExamen.get(ea.examen_id) ?? 0) + 1);
  }

  const intentoPropioPorExamen = new Map<string, ExamenIntento>();
  const presentadosPorExamen = new Map<string, number>();
  for (const intento of intentosList) {
    if (!isStaff) {
      intentoPropioPorExamen.set(intento.examen_id, intento);
    } else {
      presentadosPorExamen.set(intento.examen_id, (presentadosPorExamen.get(intento.examen_id) ?? 0) + 1);
    }
  }

  // examenesList ya viene ordenada por fecha_cierre ascendente (sin cierre
  // al final). Se separa en dos secciones, igual que Tareas: activos
  // conserva ese orden, cerrados se invierte para mostrar primero lo que
  // cerró más recientemente.
  const activos = examenesList.filter((e) => !examenCerrado(e));
  const cerrados = examenesList.filter((e) => examenCerrado(e)).reverse();

  function renderExamenCard(examen: Examen) {
    const materia = materiaById.get(examen.materia_id);
    const intentoPropio = intentoPropioPorExamen.get(examen.id);
    const presentados = presentadosPorExamen.get(examen.id) ?? 0;
    const destinatarios = destinatariosPorExamen.get(examen.id);
    const totalDestinatarios = destinatarios ?? totalAlumnos;
    const apertura = formatFecha(examen.fecha_apertura, examen.hora_apertura);
    const cierre = formatFecha(examen.fecha_cierre, examen.hora_cierre);
    const aunNoAbre = examenAunNoAbre(examen);

    return (
      <div key={examen.id} className="glass flex flex-col gap-3 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                {materia?.nombre ?? "Materia"}
              </span>
              {isStaff && destinatarios !== undefined && (
                <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-medium dark:bg-white/10">
                  <Users size={11} /> Personalizado
                </span>
              )}
            </div>
            <h2 className="mt-2 flex items-center gap-1.5 font-semibold">
              <FileQuestion size={15} className="text-muted shrink-0" />
              {examen.titulo}
            </h2>
          </div>
          {isDocente && (
            <form action={eliminarExamen.bind(null, examen.id)}>
              <button
                type="submit"
                aria-label="Eliminar examen"
                className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
              >
                <Trash2 size={15} />
              </button>
            </form>
          )}
        </div>

        {(apertura || cierre) && (
          <div className="text-muted flex flex-col gap-0.5 text-xs">
            {apertura && (
              <span className="flex items-center gap-1.5">
                <CalendarClock size={13} /> Abre: {apertura}
              </span>
            )}
            {cierre && (
              <span className="flex items-center gap-1.5">
                <CalendarClock size={13} /> Cierra: {cierre}
              </span>
            )}
          </div>
        )}

        {isDocente && (
          <ExtenderFechasExamenForm
            examenId={examen.id}
            fechaAperturaActual={examen.fecha_apertura}
            horaAperturaActual={examen.hora_apertura}
            fechaCierreActual={examen.fecha_cierre}
            horaCierreActual={examen.hora_cierre}
            cerrado={examenCerrado(examen)}
          />
        )}

        <div className="mt-1 flex items-center justify-between">
          {!isStaff &&
            (intentoPropio ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-jom-pink/30 px-2.5 py-1 text-xs font-medium text-jom-ink dark:text-jom-white">
                <GraduationCap size={13} />
                Calificación: {intentoPropio.calificacion}%
              </span>
            ) : aunNoAbre ? (
              <span className="text-muted text-xs">Aún no abre</span>
            ) : examenCerrado(examen) ? (
              <span className="text-muted text-xs">Cerrado — no presentado</span>
            ) : (
              <Link
                href={`/portal/examenes/${examen.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
              >
                Tomar examen
              </Link>
            ))}
          {isStaff && (
            <>
              <span className="text-muted text-xs">
                {presentados}/{totalDestinatarios} alumnos presentados
              </span>
              <Link
                href={`/portal/examenes/${examen.id}`}
                className="text-xs font-medium underline underline-offset-2 hover:text-jom-pink"
              >
                Ver detalle
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exámenes</h1>
          <p className="text-muted text-sm">Preguntas de opción múltiple con calificación automática</p>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <Link
              href="/portal/examenes/comparativo"
              className="text-muted inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
            >
              Comparativo
            </Link>
          )}
          {isDocente && (
            <Link
              href="/portal/examenes/nuevo"
              className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
            >
              <Plus size={15} /> Nuevo examen
            </Link>
          )}
        </div>
      </div>

      {isStaff && materiasList.length > 1 && materiaSeleccionada && (
        <MateriaSelector
          materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
          seleccionada={materiaSeleccionada}
          basePath="/portal/examenes"
        />
      )}

      {examenesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado exámenes." : "Todavía no hay exámenes disponibles."}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
              Activos {activos.length > 0 && `(${activos.length})`}
            </h2>
            {activos.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center text-sm text-muted">
                No hay exámenes activos por ahora.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">{activos.map(renderExamenCard)}</div>
            )}
          </div>

          {cerrados.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-muted text-xs font-semibold tracking-wide uppercase">
                Cerrados ({cerrados.length})
              </h2>
              <div className="grid gap-4 opacity-80 sm:grid-cols-2">{cerrados.map(renderExamenCard)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
