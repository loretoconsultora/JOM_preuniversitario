"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PeriodoPreset } from "@/lib/estado-sesion";

const PRESETS: { value: Exclude<PeriodoPreset, "personalizado">; label: string }[] = [
  { value: "semana", label: "Semana actual" },
  { value: "quincena", label: "Quincena actual" },
  { value: "mes", label: "Mes actual" },
];

// basePath ya debe incluir cualquier query param que se quiera conservar
// (ej. "/portal/asistencia?vista=calendario"), sin el "periodo" final.
export function SelectorPeriodo({
  periodoActual,
  desdeActual,
  hastaActual,
  basePath,
}: {
  periodoActual: PeriodoPreset;
  desdeActual?: string;
  hastaActual?: string;
  basePath: string;
}) {
  const router = useRouter();
  const [mostrarPersonalizado, setMostrarPersonalizado] = useState(periodoActual === "personalizado");
  const [desde, setDesde] = useState(desdeActual ?? "");
  const [hasta, setHasta] = useState(hastaActual ?? "");

  const btnClass = (activo: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
    }`;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              setMostrarPersonalizado(false);
              router.push(`${basePath}&periodo=${p.value}`);
            }}
            className={btnClass(periodoActual === p.value)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMostrarPersonalizado((v) => !v)}
          className={btnClass(periodoActual === "personalizado")}
        >
          Rango personalizado
        </button>
      </div>

      {mostrarPersonalizado && (
        <div className="glass flex flex-wrap items-center gap-2 rounded-xl p-3">
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="rounded-xl bg-transparent px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <span className="text-muted text-xs">a</span>
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="rounded-xl bg-transparent px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <button
            type="button"
            disabled={!desde || !hasta}
            onClick={() => router.push(`${basePath}&periodo=personalizado&desde=${desde}&hasta=${hasta}`)}
            className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-50 dark:bg-jom-white dark:text-jom-ink"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
