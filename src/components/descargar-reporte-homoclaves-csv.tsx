"use client";

import { Download } from "lucide-react";

type Conteo = { SR: number; CNA: number; CT: number; SC: number };
type FilaHomoclaves = Conteo & { nombre: string };

function csvEscape(valor: string | number) {
  const texto = String(valor);
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function DescargarReporteHomoclavesCSV({
  profesional,
  periodoLabel,
  filas,
  totales,
}: {
  profesional: string;
  periodoLabel: string;
  filas: FilaHomoclaves[];
  totales: Conteo;
}) {
  function descargar() {
    const encabezado = ["Nombre", "SR (realizadas)", "CNA (cancel. no anticipada)", "CT (cancel. de la sesión)", "SC (compensatorias)"];
    const filasCSV = filas.map((f) => [f.nombre, f.SR, f.CNA, f.CT, f.SC]);
    const filaTotal = ["Total", totales.SR, totales.CNA, totales.CT, totales.SC];

    const lineas = [
      [`Reporte de sesiones — ${profesional}`],
      [`Periodo: ${periodoLabel}`],
      [],
      encabezado,
      ...filasCSV,
      filaTotal,
    ]
      .map((fila) => fila.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([`﻿${lineas}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-homoclaves-${periodoLabel.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={descargar}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
    >
      <Download size={15} /> Descargar CSV para contabilidad
    </button>
  );
}
