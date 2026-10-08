"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { crearAtributoOrientacion } from "@/app/portal/evaluaciones-orientacion/actions";

export function NuevoAtributoOrientacionForm() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await crearAtributoOrientacion(new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      e.currentTarget.reset();
      router.refresh();
    } catch {
      setError("No se pudo agregar el atributo. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <form onSubmit={onSubmit} className="flex items-center gap-2">
        <input
          name="nombre"
          required
          placeholder="Nuevo atributo (ej. Madurez vocacional)"
          className="glass flex-1 rounded-xl px-4 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
        />
        <button
          type="submit"
          disabled={guardando}
          className="shrink-0 rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Agregando…" : "Agregar"}
        </button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
