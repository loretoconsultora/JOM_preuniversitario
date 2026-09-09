"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarCalificacion } from "@/app/portal/calificaciones/actions";
import type { Calificacion } from "@/types/database";

const inputClass =
  "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

export function EditarCalificacionForm({ id, calificacion }: { id: string; calificacion: Calificacion }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await actualizarCalificacion(id, new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push("/portal/calificaciones");
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Título
        <input name="titulo" required defaultValue={calificacion.titulo} className={inputClass} />
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
            defaultValue={calificacion.calificacion ?? ""}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Fecha
          <input type="date" name="fecha" required defaultValue={calificacion.fecha} className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Comentario
        <textarea name="comentario" rows={3} defaultValue={calificacion.comentario ?? ""} className={inputClass} />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
