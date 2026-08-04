"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actualizarMateriasDocente } from "@/app/portal/docentes/actions";
import type { Materia } from "@/types/database";

export function DocenteMateriasEditor({
  docenteId,
  materias,
  asignadasIniciales,
  editable,
}: {
  docenteId: string;
  materias: Materia[];
  asignadasIniciales: string[];
  editable: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>(asignadasIniciales);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await actualizarMateriasDocente(docenteId, seleccion);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const materiasPorId = new Map(materias.map((m) => [m.id, m.nombre]));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {asignadasIniciales.length === 0 ? (
          <span className="text-muted text-xs">Acceso completo</span>
        ) : (
          asignadasIniciales.map((id) => (
            <span key={id} className="rounded-full bg-black/5 px-2 py-0.5 text-xs dark:bg-white/10">
              {materiasPorId.get(id) ?? "Materia"}
            </span>
          ))
        )}
        {editable && (
          <button type="button" onClick={() => setAbierto((v) => !v)} className="text-muted text-xs underline">
            {abierto ? "Cancelar" : "Editar"}
          </button>
        )}
      </div>
      {abierto && (
        <div className="glass flex flex-col gap-1.5 rounded-xl p-3">
          {materias.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={seleccion.includes(m.id)}
                onChange={() => toggle(m.id)}
                className="h-3.5 w-3.5 rounded accent-jom-ink"
              />
              {m.nombre}
            </label>
          ))}
          {error && <p className="text-red-500">{error}</p>}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="mt-1 w-fit rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
