"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { actualizarHabilidad, eliminarHabilidad } from "@/app/portal/evaluaciones-habilidades/actions";
import type { Habilidad } from "@/types/database";

export function HabilidadChip({ habilidad }: { habilidad: Habilidad }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(habilidad.nombre);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setCargando(true);
    try {
      await actualizarHabilidad(habilidad.id, nombre);
      setEditando(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar "${habilidad.nombre}" del catálogo? También se borrará su calificación de todas las evaluaciones pasadas donde se usó. Esto no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    setCargando(true);
    try {
      await eliminarHabilidad(habilidad.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar.");
      setCargando(false);
    }
  }

  if (editando) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-black/5 py-1 pl-3 pr-1.5 text-xs dark:bg-white/10">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              guardar();
            }
            if (e.key === "Escape") {
              setEditando(false);
              setNombre(habilidad.nombre);
            }
          }}
          autoFocus
          className="w-40 bg-transparent text-xs focus:outline-none"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={cargando}
          aria-label="Guardar"
          className="text-muted rounded-full p-0.5 hover:text-fg disabled:opacity-50"
        >
          <Check size={12} />
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setNombre(habilidad.nombre);
          }}
          aria-label="Cancelar"
          className="text-muted rounded-full p-0.5 hover:text-fg"
        >
          <X size={12} />
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/5 py-1 pl-3 pr-1.5 text-xs dark:bg-white/10">
      {habilidad.nombre}
      <button
        type="button"
        onClick={() => setEditando(true)}
        aria-label={`Editar ${habilidad.nombre}`}
        className="text-muted rounded-full p-0.5 hover:text-fg"
      >
        <Pencil size={11} />
      </button>
      <button
        type="button"
        onClick={eliminar}
        disabled={cargando}
        aria-label={`Eliminar ${habilidad.nombre}`}
        className="text-muted rounded-full p-0.5 hover:text-jom-ink disabled:opacity-50"
      >
        <Trash2 size={11} />
      </button>
      {error && <span className="text-red-500">{error}</span>}
    </span>
  );
}
