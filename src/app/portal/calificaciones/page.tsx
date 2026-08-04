import Link from "next/link";
import { Plus, Trash2, Pencil, ClipboardCheck, GraduationCap } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { Calificacion, Materia, Profile } from "@/types/database";
import { eliminarCalificacion } from "./actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function CalificacionesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isStaff = profile.role === "docente" || profile.role === "directora";
  const isDocente = profile.role === "docente";

  const [{ data: calificaciones }, { data: materias }, alumnosResult] = await Promise.all([
    supabase.from("calificaciones").select("*").order("fecha", { ascending: false }),
    supabase.from("materias").select("*").order("nombre"),
    isStaff
      ? supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo")
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  const materiasList = isDocente
    ? await materiasGestionables(supabase, profile.id)
    : ((materias ?? []) as Materia[]);
  const materiaIds = new Set(materiasList.map((m) => m.id));
  const calificacionesList = ((calificaciones ?? []) as Calificacion[]).filter((c) => materiaIds.has(c.materia_id));
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));
  const alumnoById = new Map(((alumnosResult.data ?? []) as Profile[]).map((a) => [a.id, a]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calificaciones</h1>
          <p className="text-muted text-sm">
            {isStaff ? "Resultados de tareas y evaluaciones de todos los alumnos" : "Tus resultados de tareas y evaluaciones"}
          </p>
        </div>
        {isDocente && (
          <Link
            href="/portal/calificaciones/nueva"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nueva calificación
          </Link>
        )}
      </div>

      {calificacionesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isStaff ? "Aún no hay calificaciones registradas." : "Todavía no tienes calificaciones registradas."}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                {isStaff && <th className="px-5 py-3 font-medium">Alumno</th>}
                <th className="px-5 py-3 font-medium">Materia</th>
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Calificación</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                {isDocente && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {calificacionesList.map((cal) => {
                const materia = materiaById.get(cal.materia_id);
                const alumno = alumnoById.get(cal.alumno_id);
                return (
                  <tr key={cal.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    {isStaff && (
                      <td className="px-5 py-3 font-medium">{alumno?.nombre_completo ?? "—"}</td>
                    )}
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                        {materia?.nombre ?? "Materia"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {cal.tarea_id ? (
                          <ClipboardCheck size={13} className="text-muted shrink-0" />
                        ) : (
                          <GraduationCap size={13} className="text-muted shrink-0" />
                        )}
                        {cal.titulo}
                      </div>
                      {cal.comentario && <div className="text-muted text-xs">{cal.comentario}</div>}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {cal.calificacion !== null ? cal.calificacion : "—"}
                    </td>
                    <td className="text-muted px-5 py-3">{formatFecha(cal.fecha)}</td>
                    {isDocente && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/portal/calificaciones/${cal.id}/editar`}
                            aria-label="Editar calificación"
                            className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
                          >
                            <Pencil size={15} />
                          </Link>
                          <form action={eliminarCalificacion.bind(null, cal.id)}>
                            <button
                              type="submit"
                              aria-label="Eliminar calificación"
                              className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                            >
                              <Trash2 size={15} />
                            </button>
                          </form>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
