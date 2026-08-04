"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type FilaReporte = {
  nombre: string;
  programadas: number;
  completadas: number;
  reprogramadas: number;
  canceladas: number;
};

export function DescargarReportePDF({
  terapeuta,
  mesLabel,
  filas,
  totales,
}: {
  terapeuta: string;
  mesLabel: string;
  filas: FilaReporte[];
  totales: { programadas: number; completadas: number; reprogramadas: number; canceladas: number };
}) {
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    setGenerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Reporte de sesiones por paciente", 14, 18);

      doc.setFontSize(11);
      doc.text(`Terapeuta: ${terapeuta}`, 14, 28);
      doc.text(`Fecha del reporte: ${new Date().toLocaleDateString("es-MX")}`, 14, 34);
      doc.text(`Mes del reporte: ${mesLabel}`, 14, 40);

      autoTable(doc, {
        startY: 48,
        head: [["Paciente", "Programadas", "Completadas", "Reprogramadas", "Canceladas"]],
        body: filas.map((f) => [f.nombre, f.programadas, f.completadas, f.reprogramadas, f.canceladas]),
        foot: [["Total", totales.programadas, totales.completadas, totales.reprogramadas, totales.canceladas]],
        headStyles: { fillColor: [37, 45, 43] },
        footStyles: { fillColor: [234, 214, 124], textColor: [37, 45, 43], fontStyle: "bold" },
      });

      doc.save(`reporte-asistencia-${mesLabel.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={descargar}
      disabled={generando}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
    >
      <Download size={15} /> {generando ? "Generando…" : "Descargar PDF"}
    </button>
  );
}
