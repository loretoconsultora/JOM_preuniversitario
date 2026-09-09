"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Paperclip } from "lucide-react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { PreguntasTareaEditor } from "@/components/preguntas-tarea-editor";
import { crearTarea } from "@/app/portal/tareas/actions";
import type { Materia, Tema } from "@/types/database";

export function NuevaTareaForm({ materias, temas }: { materias: Materia[]; temas: Tema[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await crearTarea(new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push("/portal/tareas");
      router.refresh();
    } catch {
      setError("No se pudo crear la tarea. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Materia
          <select name="materia_id" required className={inputClass}>
            <option value="">Selecciona una materia</option>
            {materias.map((m) => (
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
            {materias.map((m) => {
              const temasMateria = temas.filter((t) => t.materia_id === m.id);
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
          <span className="text-muted text-xs">Si la vinculas, esta tarea aparece dentro de ese tema en el Temario.</span>
        </label>

        <div className="flex flex-col gap-1.5 text-sm">
          Instrucciones
          <RichTextEditor name="descripcion" placeholder="Instrucciones para el alumno (opcional)" />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="pide_respuesta_texto" className="h-4 w-4 rounded accent-jom-ink" />
          Pedir respuesta de texto (tipo foro/actividad)
        </label>

        <div>
          <p className="mb-2 text-sm font-medium">Preguntas (opcional)</p>
          <p className="text-muted mb-2 text-xs">
            Opción múltiple se autocalifica al instante; abierta la revisas tú manualmente.
          </p>
          <PreguntasTareaEditor />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <details className="glass rounded-xl p-4" open>
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
            <CalendarDays size={15} className="text-muted" /> Fecha y hora límite de entrega
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input type="date" name="fecha_entrega" className={inputClass} />
            <input type="time" name="hora_limite" className={inputClass} />
          </div>
          <p className="text-muted mt-1.5 text-xs">
            Si no eliges hora, se cierra a las 11:59 p.m. de ese día. Pasada la hora límite, el alumno ya no puede
            cargar entregas.
          </p>
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

      {error && <p className="text-sm text-red-500 lg:col-span-2">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="lg:col-span-2 mt-2 w-fit rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Creando…" : "Crear tarea"}
      </button>
    </form>
  );
}
