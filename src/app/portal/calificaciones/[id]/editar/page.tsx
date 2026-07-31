import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Calificacion, Materia, Profile } from "@/types/database";
import { actualizarCalificacion } from "../../actions";

export default async function EditarCalificacionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const { data: calificacion } = await supabase.from("calificaciones").select("*").eq("id", id).single();
  if (!calificacion) notFound();
  const calificacionData = calificacion as Calificacion;

  const [{ data: alumno }, { data: materia }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", calificacionData.alumno_id).single(),
    supabase.from("materias").select("*").eq("id", calificacionData.materia_id).single(),
  ]);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/calificaciones" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a calificaciones
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-semibold">Editar calificación</h1>
        <p className="text-muted mb-6 text-sm">
          {(alumno as Profile | null)?.nombre_completo ?? "Alumno"} · {(materia as Materia | null)?.nombre ?? "Materia"}
          {calificacionData.tarea_id && " · vinculada a una tarea"}
        </p>

        <form action={actualizarCalificacion.bind(null, id)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Título
            <input name="titulo" required defaultValue={calificacionData.titulo} className={inputClass} />
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
                defaultValue={calificacionData.calificacion ?? ""}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Fecha
              <input type="date" name="fecha" required defaultValue={calificacionData.fecha} className={inputClass} />
            </label>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            Comentario
            <textarea
              name="comentario"
              rows={3}
              defaultValue={calificacionData.comentario ?? ""}
              className={inputClass}
            />
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
