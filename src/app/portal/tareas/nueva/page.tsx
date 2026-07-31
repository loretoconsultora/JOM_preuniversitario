import Link from "next/link";
import { ArrowLeft, CalendarDays, Paperclip } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Tema } from "@/types/database";
import { RichTextEditor } from "@/components/rich-text-editor";
import { crearTarea } from "../actions";

export default async function NuevaTareaPage() {
  await requireDocente();
  const supabase = await createClient();
  const [{ data: materias }, { data: temas }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("temas").select("*").order("orden"),
  ]);
  const materiasList = (materias ?? []) as Materia[];
  const temasList = (temas ?? []) as Tema[];

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Nueva tarea</h1>
        <form action={crearTarea} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Materia
              <select name="materia_id" required className={inputClass}>
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
              <input name="titulo" required placeholder="Ej. Ejercicios de cinemática" className={inputClass} />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              Tema del temario (opcional)
              <select name="tema_id" className={inputClass}>
                <option value="">Sin vincular a un tema</option>
                {materiasList.map((m) => {
                  const temasMateria = temasList.filter((t) => t.materia_id === m.id);
                  if (temasMateria.length === 0) return null;
                  return (
                    <optgroup key={m.id} label={m.nombre}>
                      {temasMateria.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.titulo}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              <span className="text-muted text-xs">
                Si la vinculas, esta tarea aparece dentro de ese tema en el Temario.
              </span>
            </label>

            <div className="flex flex-col gap-1.5 text-sm">
              Instrucciones
              <RichTextEditor name="descripcion" placeholder="Instrucciones para el alumno (opcional)" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <details className="glass rounded-xl p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <CalendarDays size={15} className="text-muted" /> Fecha de entrega
              </summary>
              <input type="date" name="fecha_entrega" className={`${inputClass} mt-3 w-full`} />
            </details>

            <details className="glass rounded-xl p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <Paperclip size={15} className="text-muted" /> Archivos adjuntos
              </summary>
              <input
                type="file"
                name="archivos"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                className="glass mt-3 w-full rounded-xl px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
              />
              <span className="text-muted mt-2 block text-xs">PDF, Word, PowerPoint o imágenes. Máximo ~10 MB en total.</span>
            </details>
          </div>

          <button
            type="submit"
            className="lg:col-span-2 mt-2 w-fit rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Crear tarea
          </button>
        </form>
      </div>
    </div>
  );
}
