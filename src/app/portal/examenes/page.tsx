import Link from "next/link";
import { Plus, Trash2, GraduationCap, FileQuestion, Users } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Examen, ExamenAlumno, ExamenIntento, Materia } from "@/types/database";
import { eliminarExamen } from "./actions";

export default async function ExamenesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isDocente = profile.role === "docente";
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const [{ data: materias }, { data: examenes }, { data: intentos }, alumnosCountResult, { data: examenAlumnos }] =
    await Promise.all([
      supabase.from("materias").select("*").order("nombre"),
      // RLS: el alumno solo ve los exámenes abiertos a todos o asignados a él.
      supabase.from("examenes").select("*").order("created_at", { ascending: false }),
      // RLS: el alumno solo ve los suyos, docente/directora ven todos.
      supabase.from("examen_intentos").select("*"),
      isStaff
        ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "alumno")
        : Promise.resolve({ count: 0 }),
      isStaff ? supabase.from("examen_alumnos").select("*") : Promise.resolve({ data: [] }),
    ]);

  const materiasList = (materias ?? []) as Materia[];
  const examenesList = (examenes ?? []) as Examen[];
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Exámenes</h1>
          <p className="text-muted text-sm">Preguntas de opción múltiple con calificación automática</p>
        </div>
        {isDocente && (
          <Link
            href="/portal/examenes/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo examen
          </Link>
        )}
      </div>

      {examenesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado exámenes." : "Todavía no hay exámenes disponibles."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {examenesList.map((examen) => {
            const materia = materiaById.get(examen.materia_id);
            const intentoPropio = intentoPropioPorExamen.get(examen.id);
            const presentados = presentadosPorExamen.get(examen.id) ?? 0;
            const destinatarios = destinatariosPorExamen.get(examen.id);
            const totalDestinatarios = destinatarios ?? totalAlumnos;

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

                <div className="mt-1 flex items-center justify-between">
                  {!isStaff &&
                    (intentoPropio ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-jom-pink/30 px-2.5 py-1 text-xs font-medium text-jom-ink dark:text-jom-white">
                        <GraduationCap size={13} />
                        Calificación: {intentoPropio.calificacion}%
                      </span>
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
          })}
        </div>
      )}
    </div>
  );
}
