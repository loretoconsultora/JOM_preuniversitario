import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia } from "@/types/database";
import { crearTarea } from "../actions";

export default async function NuevaTareaPage() {
  await requireDocente();
  const supabase = await createClient();
  const { data: materias } = await supabase.from("materias").select("*").order("nombre");
  const materiasList = (materias ?? []) as Materia[];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nueva tarea</h1>
        <form action={crearTarea} className="flex flex-col gap-4">
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
            Título
            <input
              name="titulo"
              required
              placeholder="Ej. Ejercicios de cinemática"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Descripción
            <textarea
              name="descripcion"
              rows={4}
              placeholder="Instrucciones para el alumno (opcional)"
              className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Fecha de entrega
            <input
              type="date"
              name="fecha_entrega"
              className="glass rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            Archivos adjuntos
            <input
              type="file"
              name="archivos"
              multiple
              accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
              className="glass rounded-xl px-4 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
            />
            <span className="text-muted text-xs">PDF, Word, PowerPoint o imágenes. Máximo ~10 MB en total.</span>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Crear tarea
          </button>
        </form>
      </div>
    </div>
  );
}
