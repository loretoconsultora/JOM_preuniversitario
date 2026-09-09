"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { actualizarFechaAltaPaciente } from "@/app/portal/pacientes/actions";
import { pacienteDesdeLabel } from "@/lib/paciente-fecha";

export function FechaAltaEditor({ pacienteId, fechaAlta }: { pacienteId: string; fechaAlta: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [mes, setMes] = useState(fechaAlta.slice(0, 7));
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setCargando(true);
    setError(null);
    try {
      await actualizarFechaAltaPaciente(pacienteId, mes);
      setEditando(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la fecha.");
    } finally {
      setCargando(false);
    }
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg"
      >
        {pacienteDesdeLabel(fechaAlta, new Date())}
        <Pencil size={11} />
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="month"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="glass rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={cargando || !mes}
          className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setMes(fechaAlta.slice(0, 7));
            setError(null);
          }}
          className="text-muted text-xs hover:text-fg"
        >
          Cancelar
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
