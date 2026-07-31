import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Profile } from "@/types/database";
import { crearEvaluacion } from "../actions";

export default async function NuevaEvaluacionPage() {
  await requireDocente();
  const supabase = await createClient();
  const [{ data: materias }, { data: alumnos }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
  ]);
  const materiasList = (materias ?? []) as Materia[];
  const alumnosList = (alumnos ?? []) as Profile[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/evaluaciones" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a evaluaciones
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nueva evaluación</h1>

        {alumnosList.length === 0 ? (
          <p className="text-muted text-sm">
            Primero registra alumnos en la sección{" "}
            <Link href="/portal/alumnos/nuevo" className="font-medium underline">
              Alumnos
            </Link>
            .
          </p>
        ) : (
          <form action={crearEvaluacion} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Alumno
              <select
                name="alumno_id"
                required
                className="glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
              >
                <option value="">Selecciona un alumno</option>
                {alumnosList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre_completo}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              Materia
              <select
                name="materia_id"
                required
                className="glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
              >
                <option value="">Selecciona una materia</option>
                {materiasList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              Evaluación
              <input
                name="titulo"
                required
                placeholder="Ej. Examen parcial 1"
                className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                Calificación
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  name="calificacion"
                  placeholder="0-100"
                  className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Fecha
                <input
                  type="date"
                  name="fecha"
                  className="glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 text-sm">
              Comentario
              <textarea
                name="comentario"
                rows={3}
                placeholder="Retroalimentación para el alumno (opcional)"
                className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
              />
            </label>

            <button
              type="submit"
              className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
            >
              Guardar evaluación
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
