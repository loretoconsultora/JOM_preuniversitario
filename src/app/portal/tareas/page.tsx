import Link from "next/link";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Tarea } from "@/types/database";
import { eliminarTarea } from "./actions";

function formatFecha(fecha: string | null) {
  if (!fecha) return null;
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function TareasPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: materias }, { data: tareas }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("tareas").select("*").order("fecha_entrega", { ascending: true, nullsFirst: false }),
  ]);

  const materiasList = (materias ?? []) as Materia[];
  const tareasList = (tareas ?? []) as Tarea[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));

  const isDocente = profile.role === "docente";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tareas</h1>
          <p className="text-muted text-sm">Química, Física y Matemáticas</p>
        </div>
        {isDocente && (
          <Link
            href="/portal/tareas/nueva"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nueva tarea
          </Link>
        )}
      </div>

      {tareasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has creado tareas." : "Todavía no hay tareas asignadas."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {tareasList.map((tarea) => {
            const materia = materiaById.get(tarea.materia_id);
            const fecha = formatFecha(tarea.fecha_entrega);
            return (
              <div key={tarea.id} className="glass flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                      {materia?.nombre ?? "Materia"}
                    </span>
                    <h2 className="mt-2 font-semibold">{tarea.titulo}</h2>
                  </div>
                  {isDocente && (
                    <form action={eliminarTarea.bind(null, tarea.id)}>
                      <button
                        type="submit"
                        aria-label="Eliminar tarea"
                        className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  )}
                </div>
                {tarea.descripcion && (
                  <p className="text-sm text-fg/80">{tarea.descripcion}</p>
                )}
                {fecha && (
                  <div className="text-muted flex items-center gap-1.5 text-xs">
                    <CalendarDays size={13} /> Entrega: {fecha}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
