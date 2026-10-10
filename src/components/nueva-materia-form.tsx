"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { crearMateria } from "@/app/portal/docentes/actions";

export function NuevaMateriaForm() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await crearMateria(nombre);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setNombre("");
      setAbierto(false);
      router.refresh();
    } catch {
      setError("No se pudo crear la materia. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
      >
        <Plus size={15} /> Nueva materia
      </button>
    );
  }

  return (
    <div className="glass flex flex-col gap-2 rounded-2xl p-4">
      <p className="text-sm font-semibold">Nueva materia</p>
      <p className="text-muted text-xs">
        Se crea y queda asignada automáticamente a tu cuenta, para que tengas acceso inmediato.
      </p>
      <input
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre de la materia"
        className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando || !nombre.trim()}
          className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Creando…" : "Crear materia"}
        </button>
        <button
          type="button"
          onClick={() => {
            setAbierto(false);
            setError(null);
          }}
          className="text-muted text-xs hover:text-fg"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
