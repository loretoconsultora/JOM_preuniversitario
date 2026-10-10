import Link from "next/link";
import type { PeriodoPreset } from "@/lib/estado-sesion";
import { HOMOCLAVE_LABEL } from "@/lib/estado-sesion";
import { DescargarReporteHomoclavesCSV } from "@/components/descargar-reporte-homoclaves-csv";

type Conteo = { SR: number; CNA: number; CT: number; SC: number };
type FilaHomoclaves = Conteo & { nombre: string };

const PRESETS: { value: PeriodoPreset; label: string }[] = [
  { value: "semana", label: "Semana actual" },
  { value: "quincena", label: "Quincena actual" },
  { value: "mes", label: "Mes actual" },
];

export function ResumenHomoclaves({
  profesional,
  periodoActual,
  periodoLabel,
  hrefParaPeriodo,
  filas,
  totales,
}: {
  profesional: string;
  periodoActual: PeriodoPreset;
  periodoLabel: string;
  hrefParaPeriodo: (p: PeriodoPreset) => string;
  filas: FilaHomoclaves[];
  totales: Conteo;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Resumen para contabilidad ({periodoLabel})</p>
        <div className="flex gap-1.5">
          {PRESETS.map((p) => (
            <Link
              key={p.value}
              href={hrefParaPeriodo(p.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                periodoActual === p.value
                  ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                  : "glass hover:opacity-80"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="glass grid grid-cols-2 gap-3 rounded-2xl p-5 sm:grid-cols-4">
        <div>
          <p className="text-muted text-xs uppercase">{HOMOCLAVE_LABEL.SR}</p>
          <p className="text-xl font-semibold">{totales.SR}</p>
        </div>
        <div>
          <p className="text-muted text-xs uppercase">{HOMOCLAVE_LABEL.CNA}</p>
          <p className="text-xl font-semibold">{totales.CNA}</p>
        </div>
        <div>
          <p className="text-muted text-xs uppercase">{HOMOCLAVE_LABEL.CT}</p>
          <p className="text-xl font-semibold">{totales.CT}</p>
        </div>
        <div>
          <p className="text-muted text-xs uppercase">{HOMOCLAVE_LABEL.SC}</p>
          <p className="text-xl font-semibold">{totales.SC}</p>
        </div>
      </div>

      {filas.length > 0 && (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">SR</th>
                <th className="px-5 py-3 font-medium">CNA</th>
                <th className="px-5 py-3 font-medium">CT</th>
                <th className="px-5 py-3 font-medium">SC</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.nombre} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-5 py-3 font-medium">{f.nombre}</td>
                  <td className="px-5 py-3">{f.SR}</td>
                  <td className="px-5 py-3">{f.CNA}</td>
                  <td className="px-5 py-3">{f.CT}</td>
                  <td className="px-5 py-3">{f.SC}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 font-semibold dark:border-white/15">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3">{totales.SR}</td>
                <td className="px-5 py-3">{totales.CNA}</td>
                <td className="px-5 py-3">{totales.CT}</td>
                <td className="px-5 py-3">{totales.SC}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div>
        <DescargarReporteHomoclavesCSV profesional={profesional} periodoLabel={periodoLabel} filas={filas} totales={totales} />
      </div>
    </div>
  );
}
