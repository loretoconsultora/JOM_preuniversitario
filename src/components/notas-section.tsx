"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { agregarNotaPaciente } from "@/app/portal/pacientes/actions";
import type { PacienteNota } from "@/types/database";

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function formatFechaSesion(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

type NotaDeSesion = { id: string; fecha: string; contenido: string };

export function NotasSection({
  pacienteId,
  notas,
  notasDeSesion = [],
}: {
  pacienteId: string;
  notas: PacienteNota[];
  notasDeSesion?: NotaDeSesion[];
}) {
  const router = useRouter();
  const [nuevo, setNuevo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);

  const combinadas = [
    ...notas.map((n) => ({
      id: n.id,
      contenido: n.contenido,
      fechaOrden: n.created_at,
      fechaLabel: formatFecha(n.created_at),
      deSesion: false,
    })),
    ...notasDeSesion.map((n) => ({
      id: n.id,
      contenido: n.contenido,
      fechaOrden: n.fecha,
      fechaLabel: formatFechaSesion(n.fecha),
      deSesion: true,
    })),
  ].sort((a, b) => b.fechaOrden.localeCompare(a.fechaOrden));

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await agregarNotaPaciente(pacienteId, nuevo);
      setNuevo("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la nota.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Notas</p>

      <div className="glass flex flex-col gap-2 rounded-2xl p-4">
        <textarea
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          rows={3}
          placeholder="Agregar una nueva nota"
          className="text-muted rounded-xl bg-black/5 px-3 py-2 text-sm placeholder:text-muted focus:text-fg focus:outline-none focus:ring-2 focus:ring-jom-pink dark:bg-white/5"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !nuevo.trim()}
          className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : "Agregar nota"}
        </button>
      </div>

      {combinadas.length === 0 ? (
        <p className="text-muted text-sm">Todavía no hay notas.</p>
      ) : (
        <div className="glass flex flex-col divide-y divide-black/5 rounded-2xl dark:divide-white/5">
          {combinadas.map((n) => {
            const abierta = expandida === n.id;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setExpandida(abierta ? null : n.id)}
                className="flex flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              >
                <p className={`text-sm ${abierta ? "whitespace-pre-line" : "truncate"}`}>{n.contenido}</p>
                <span className="text-muted text-xs">
                  {n.fechaLabel}
                  {n.deSesion && " · Nota de sesión"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
