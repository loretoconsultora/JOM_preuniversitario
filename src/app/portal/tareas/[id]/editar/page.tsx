import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Paperclip, Trash2 } from "lucide-react";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import type { PreguntaBorrador, Tarea, TareaArchivo, TareaPregunta, Tema } from "@/types/database";
import { TAREAS_BUCKET, formatBytes } from "@/lib/storage";
import { RichTextEditor } from "@/components/rich-text-editor";
import { PreguntasTareaEditor } from "@/components/preguntas-tarea-editor";
import { actualizarTarea, eliminarArchivoTarea } from "../../actions";

export default async function EditarTareaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireDocente();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tarea }, materiasList, { data: archivos }, { data: temas }, { data: preguntas }] =
    await Promise.all([
      supabase.from("tareas").select("*").eq("id", id).single(),
      materiasGestionables(supabase, profile.id),
      supabase.from("tarea_archivos").select("*").eq("tarea_id", id),
      supabase.from("temas").select("*").order("orden"),
      supabase.from("tarea_preguntas").select("*").eq("tarea_id", id).order("orden"),
    ]);

  if (!tarea) notFound();
  const tareaData = tarea as Tarea;
  const archivosList = (archivos ?? []) as TareaArchivo[];
  const temasList = (temas ?? []) as Tema[];
  const preguntasIniciales: PreguntaBorrador[] = ((preguntas ?? []) as TareaPregunta[]).map((p) => ({
    tipo: p.tipo,
    enunciado: p.enunciado,
    opciones: p.opciones ?? ["", "", "", ""],
    respuesta_correcta: p.respuesta_correcta ?? 0,
  }));

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

            <label className="flex flex-col gap-1.5 text-sm">
              Tema del temario (opcional)
              <select name="tema_id" defaultValue={tareaData.tema_id ?? ""} className={inputClass}>
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
              <RichTextEditor
                name="descripcion"
                defaultValue={tareaData.descripcion ?? ""}
                placeholder="Instrucciones para el alumno (opcional)"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="pide_respuesta_texto"
                defaultChecked={tareaData.pide_respuesta_texto}
                className="h-4 w-4 rounded accent-jom-ink"
              />
              Pedir respuesta de texto (tipo foro/actividad)
            </label>

            <div>
              <p className="mb-2 text-sm font-medium">Preguntas (opcional)</p>
              <p className="text-muted mb-2 text-xs">
                Opción múltiple se autocalifica al instante; abierta la revisas tú manualmente.
              </p>
              <PreguntasTareaEditor inicial={preguntasIniciales} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <details className="glass rounded-xl p-4" open>
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
                <CalendarDays size={15} className="text-muted" /> Fecha y hora límite de entrega
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  name="fecha_entrega"
                  defaultValue={tareaData.fecha_entrega ?? ""}
                  className={inputClass}
                />
                <input
                  type="time"
                  name="hora_limite"
                  defaultValue={tareaData.hora_limite?.slice(0, 5) ?? ""}
                  className={inputClass}
                />
              </div>
              <p className="text-muted mt-1.5 text-xs">
                Si no eliges hora, se cierra a las 11:59 p.m. de ese día. Pasada la hora límite, el alumno ya no
                puede cargar entregas.
              </p>
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
