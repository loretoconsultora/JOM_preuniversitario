"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function DescargarTablaPDF({
  label,
  titulo,
  meta,
  head,
  body,
  notaFinal,
  archivo,
  className,
}: {
  label?: string;
  titulo: string;
  meta: string[];
  head: string[];
  body: (string | number)[][];
  notaFinal?: string;
  archivo: string;
  className?: string;
}) {
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    setGenerando(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text(titulo, 14, 18);

      doc.setFontSize(11);
      meta.forEach((linea, i) => doc.text(linea, 14, 28 + i * 6));

      autoTable(doc, {
        startY: 28 + meta.length * 6 + 4,
        head: [head],
        body,
        headStyles: { fillColor: [37, 45, 43] },
      });

      if (notaFinal) {
        const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        doc.setFontSize(11);
        doc.text("Conclusiones:", 14, finalY + 10);
        const lineas = doc.splitTextToSize(notaFinal, 180);
        doc.text(lineas, 14, finalY + 16);
      }

      doc.save(archivo);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={descargar}
      disabled={generando}
      className={
        className ??
        "inline-flex shrink-0 items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      }
    >
      <Download size={15} /> {generando ? "Generando…" : (label ?? "Descargar PDF")}
    </button>
  );
}
