import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Evaluacion, Materia, Profile } from "@/types/database";
import { eliminarEvaluacion } from "./actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function EvaluacionesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isStaff = profile.role === "docente" || profile.role === "directora";
  const isDocente = profile.role === "docente";

  const [{ data: evaluaciones }, { data: materias }, alumnosResult] = await Promise.all([
    supabase.from("evaluaciones").select("*").order("fecha", { ascending: false }),
    supabase.from("materias").select("*").order("nombre"),
    isStaff
      ? supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo")
      : Promise.resolve({ data: [] as Profile[] }),
  ]);

  const evaluacionesList = (evaluaciones ?? []) as Evaluacion[];
  const materiasList = (materias ?? []) as Materia[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));
  const alumnoById = new Map(((alumnosResult.data ?? []) as Profile[]).map((a) => [a.id, a]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Evaluaciones</h1>
          <p className="text-muted text-sm">
            {isStaff ? "Rendimiento de todos los alumnos" : "Tus calificaciones por materia"}
          </p>
        </div>
        {isDocente && (
          <Link
            href="/portal/evaluaciones/nueva"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nueva evaluación
          </Link>
        )}
      </div>

      {evaluacionesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isStaff ? "Aún no hay evaluaciones registradas." : "Todavía no tienes evaluaciones registradas."}
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                {isStaff && <th className="px-5 py-3 font-medium">Alumno</th>}
                <th className="px-5 py-3 font-medium">Materia</th>
                <th className="px-5 py-3 font-medium">Evaluación</th>
                <th className="px-5 py-3 font-medium">Calificación</th>
                <th className="px-5 py-3 font-medium">Fecha</th>
                {isDocente && <th className="px-5 py-3" />}
              </tr>
            </thead>
            <tbody>
              {evaluacionesList.map((ev) => {
                const materia = materiaById.get(ev.materia_id);
                const alumno = alumnoById.get(ev.alumno_id);
                return (
                  <tr key={ev.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    {isStaff && (
                      <td className="px-5 py-3 font-medium">{alumno?.nombre_completo ?? "—"}</td>
                    )}
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                        {materia?.nombre ?? "Materia"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>{ev.titulo}</div>
                      {ev.comentario && <div className="text-muted text-xs">{ev.comentario}</div>}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {ev.calificacion !== null ? ev.calificacion : "—"}
                    </td>
                    <td className="text-muted px-5 py-3">{formatFecha(ev.fecha)}</td>
                    {isDocente && (
                      <td className="px-5 py-3 text-right">
                        <form action={eliminarEvaluacion.bind(null, ev.id)}>
                          <button
                            type="submit"
                            aria-label="Eliminar evaluación"
                            className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                          >
                            <Trash2 size={15} />
                          </button>
                        </form>
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
