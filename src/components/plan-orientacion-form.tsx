"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPlanOrientacion } from "@/app/portal/orientados/actions";
import type { OrientacionPlan } from "@/types/database";

export function PlanOrientacionForm({ orientadoId, plan }: { orientadoId: string; plan: OrientacionPlan | null }) {
  const router = useRouter();
  const [metas, setMetas] = useState(plan?.metas ?? "");
  const [carreras, setCarreras] = useState(plan?.carreras_interes ?? "");
  const [universidades, setUniversidades] = useState(plan?.universidades_interes ?? "");
  const [pasos, setPasos] = useState(plan?.proximos_pasos ?? "");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await guardarPlanOrientacion(orientadoId, {
        metas,
        carreras_interes: carreras,
        universidades_interes: universidades,
        proximos_pasos: pasos,
      });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setGuardado(true);
      router.refresh();
    } catch {
      setError("No se pudo guardar el plan. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm">
        Metas
        <textarea
          value={metas}
          onChange={(e) => {
            setMetas(e.target.value);
            setGuardado(false);
          }}
          rows={2}
          placeholder="Qué busca lograr en este proceso"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Carreras de interés
        <textarea
          value={carreras}
          onChange={(e) => {
            setCarreras(e.target.value);
            setGuardado(false);
          }}
          rows={2}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Universidades de interés
        <textarea
          value={universidades}
          onChange={(e) => {
            setUniversidades(e.target.value);
            setGuardado(false);
          }}
          rows={2}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Próximos pasos
        <textarea
          value={pasos}
          onChange={(e) => {
            setPasos(e.target.value);
            setGuardado(false);
          }}
          rows={2}
          className={inputClass}
        />
      </label>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : guardado ? "Guardado ✓" : "Guardar plan"}
      </button>
    </div>
  );
}
