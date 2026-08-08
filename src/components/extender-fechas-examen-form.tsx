"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, AlertCircle } from "lucide-react";
import { actualizarFechasExamen } from "@/app/portal/examenes/actions";

export function ExtenderFechasExamenForm({
  examenId,
  fechaAperturaActual,
  horaAperturaActual,
  fechaCierreActual,
  horaCierreActual,
  cerrado,
}: {
  examenId: string;
  fechaAperturaActual: string | null;
  horaAperturaActual: string | null;
  fechaCierreActual: string | null;
  horaCierreActual: string | null;
  cerrado: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [fechaApertura, setFechaApertura] = useState(fechaAperturaActual ?? "");
  const [horaApertura, setHoraApertura] = useState(horaAperturaActual?.slice(0, 5) ?? "");
  const [fechaCierre, setFechaCierre] = useState(fechaCierreActual ?? "");
  const [horaCierre, setHoraCierre] = useState(horaCierreActual?.slice(0, 5) ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      await actualizarFechasExamen(examenId, { fecha_apertura: fechaApertura, hora_apertura: horaApertura, fecha_cierre: fechaCierre, hora_cierre: horaCierre });
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron actualizar las fechas.");
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
          cerrado ? "text-jom-pink" : "text-muted hover:text-fg"
        }`}
      >
        <CalendarClock size={12} /> {cerrado ? "Examen cerrado — reabrir" : "Cambiar fechas de apertura/cierre"}
      </button>
    );
  }

  return (
    <div className="glass flex flex-col gap-2 rounded-xl p-2.5">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Abre el
          <input type="date" value={fechaApertura} onChange={(e) => setFechaApertura(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Hora
          <input
            type="time"
            value={horaApertura}
            onChange={(e) => setHoraApertura(e.target.value)}
            disabled={!fechaApertura}
            className={`${inputClass} disabled:opacity-50`}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs">
          Cierra el
          <input type="date" value={fechaCierre} onChange={(e) => setFechaCierre(e.target.value)} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Hora
          <input
            type="time"
            value={horaCierre}
            onChange={(e) => setHoraCierre(e.target.value)}
            disabled={!fechaCierre}
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
        <button type="button" onClick={() => setAbierto(false)} className="text-muted text-xs underline underline-offset-2">
          Cancelar
        </button>
      </div>
      <p className="text-muted text-xs">Deja fecha de apertura o cierre vacía para quitar ese límite.</p>
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}
