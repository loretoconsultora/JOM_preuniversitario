"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { actualizarAtributoOrientacion, eliminarAtributoOrientacion } from "@/app/portal/evaluaciones-orientacion/actions";
import type { OrientacionAtributo } from "@/types/database";

export function AtributoOrientacionChip({ atributo }: { atributo: OrientacionAtributo }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(atributo.nombre);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setCargando(true);
    try {
      const resultado = await actualizarAtributoOrientacion(atributo.id, nombre);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setEditando(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar() {
    if (
      !window.confirm(
        `¿Eliminar "${atributo.nombre}" del catálogo? También se borrará su calificación de todas las evaluaciones pasadas donde se usó. Esto no se puede deshacer.`
      )
    ) {
      return;
    }
    setError(null);
    setCargando(true);
    try {
      const resultado = await eliminarAtributoOrientacion(atributo.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo eliminar. Revisa tu conexión e intenta de nuevo.");
    } finally {
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
              setNombre(atributo.nombre);
            }
          }}
          autoFocus
          className="w-40 bg-transparent text-xs focus:outline-none"
        />
        <button type="button" onClick={guardar} disabled={cargando} aria-label="Guardar" className="text-muted rounded-full p-0.5 hover:text-fg disabled:opacity-50">
          <Check size={12} />
        </button>
        <button
          type="button"
          onClick={() => {
            setEditando(false);
            setNombre(atributo.nombre);
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
      {atributo.nombre}
      <button type="button" onClick={() => setEditando(true)} aria-label={`Editar ${atributo.nombre}`} className="text-muted rounded-full p-0.5 hover:text-fg">
        <Pencil size={11} />
      </button>
      <button
        type="button"
        onClick={eliminar}
        disabled={cargando}
        aria-label={`Eliminar ${atributo.nombre}`}
        className="text-muted rounded-full p-0.5 hover:text-jom-ink disabled:opacity-50"
      >
        <Trash2 size={11} />
      </button>
      {error && <span className="text-red-500">{error}</span>}
    </span>
  );
}
