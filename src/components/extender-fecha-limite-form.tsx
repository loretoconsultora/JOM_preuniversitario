"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, AlertCircle } from "lucide-react";
import { extenderFechaLimiteTarea } from "@/app/portal/tareas/actions";

export function ExtenderFechaLimiteForm({
  tareaId,
  fechaActual,
  horaActual,
  cerrada,
}: {
  tareaId: string;
  fechaActual: string | null;
  horaActual: string | null;
  cerrada: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fecha, setFecha] = useState(fechaActual ?? "");
  const [hora, setHora] = useState(horaActual?.slice(0, 5) ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await extenderFechaLimiteTarea(tareaId, fecha, hora);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la fecha límite.");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={`inline-flex w-fit items-center gap-1 text-xs font-medium underline underline-offset-2 ${
          cerrada ? "text-jom-pink" : "text-muted hover:text-fg"
        }`}
      >
        <CalendarClock size={12} /> {cerrada ? "Entrega cerrada — reabrir" : "Cambiar fecha límite"}
      </button>
    );
  }

  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-2.5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Fecha
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Hora
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={!fecha}
            className={`${inputClass} disabled:opacity-50`}
          />
        </label>
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="text-muted text-xs underline underline-offset-2"
        >
          Cancelar
        </button>
      </div>
      <p className="text-muted text-xs">Deja la fecha vacía para quitar la fecha límite por completo.</p>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
