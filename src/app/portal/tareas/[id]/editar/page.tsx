import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Paperclip, Trash2 } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Tarea, TareaArchivo } from "@/types/database";
import { TAREAS_BUCKET, formatBytes } from "@/lib/storage";
import { RichTextEditor } from "@/components/rich-text-editor";
import { actualizarTarea, eliminarArchivoTarea } from "../../actions";

export default async function EditarTareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tarea }, { data: materias }, { data: archivos }] = await Promise.all([
    supabase.from("tareas").select("*").eq("id", id).single(),
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("tarea_archivos").select("*").eq("tarea_id", id),
  ]);

  if (!tarea) notFound();
  const tareaData = tarea as Tarea;
  const materiasList = (materias ?? []) as Materia[];
  const archivosList = (archivos ?? []) as TareaArchivo[];

  const signedUrlByPath = new Map<string, string>();
  if (archivosList.length > 0) {
    const { data: signedUrls } = await supabase.storage
      .from(TAREAS_BUCKET)
      .createSignedUrls(
        archivosList.map((a) => a.storage_path),
        3600
      );
    for (const s of signedUrls ?? []) {
      if (s.signedUrl) signedUrlByPath.set(s.path ?? "", s.signedUrl);
    }
  }

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/portal/tareas" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a tareas
      </Link>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold">Editar tarea</h1>

        <form action={actualizarTarea.bind(null, id)} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Materia
              <select name="materia_id" required defaultValue={tareaData.materia_id} className={inputClass}>
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
              <input name="titulo" required defaultValue={tareaData.titulo} className={inputClass} />
            </label>

            <div className="flex flex-col gap-1.5 text-sm">
              Instrucciones
              <RichTextEditor
                name="descripcion"
                defaultValue={tareaData.descripcion ?? ""}
                placeholder="Instrucciones para el alumno (opcional)"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <details className="glass rounded-xl p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <CalendarDays size={15} className="text-muted" /> Fecha de entrega
              </summary>
              <input
                type="date"
                name="fecha_entrega"
                defaultValue={tareaData.fecha_entrega ?? ""}
                className={`${inputClass} mt-3 w-full`}
              />
            </details>

            <details className="glass rounded-xl p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <Paperclip size={15} className="text-muted" /> Archivos adjuntos
              </summary>

              {archivosList.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {archivosList.map((archivo) => (
                    <div key={archivo.id} className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
                      <Paperclip size={13} className="text-muted shrink-0" />
                      <a
                        href={signedUrlByPath.get(archivo.storage_path) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate hover:underline"
                      >
                        {archivo.nombre_archivo}
                      </a>
                      {archivo.tamano_bytes && (
                        <span className="text-muted shrink-0">{formatBytes(archivo.tamano_bytes)}</span>
                      )}
                      <form action={eliminarArchivoTarea.bind(null, archivo.id, id)}>
                        <button
                          type="submit"
                          aria-label="Eliminar archivo"
                          className="text-muted shrink-0 rounded-full p-1 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                        >
                          <Trash2 size={13} />
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              <input
                type="file"
                name="archivos"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp"
                className="glass mt-3 w-full rounded-xl px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white focus:outline-none focus:ring-2 focus:ring-jom-pink dark:file:bg-jom-white dark:file:text-jom-ink"
              />
              <span className="text-muted mt-2 block text-xs">Agregar más archivos</span>
            </details>
          </div>

          <button
            type="submit"
            className="lg:col-span-2 mt-2 w-fit rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            Guardar cambios
          </button>
        </form>
      </div>
    </div>
  );
}
