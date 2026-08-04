"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { crearEvaluacion } from "@/app/portal/evaluaciones-habilidades/actions";
import { DescargarTablaPDF } from "@/components/descargar-tabla-pdf";
import type { Habilidad } from "@/types/database";

export function NuevaEvaluacionForm({
  pacienteId,
  pacienteNombre,
  terapeutaNombre,
  habilidades,
}: {
  pacienteId: string;
  pacienteNombre: string;
  terapeutaNombre: string;
  habilidades: Habilidad[];
}) {
  const router = useRouter();
  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({});
  const [conclusiones, setConclusiones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<{
    body: (string | number)[][];
    conclusiones: string;
  } | null>(null);

  async function guardar() {
    setError(null);
    const lista = Object.entries(calificaciones).map(([habilidad_id, calificacion]) => ({ habilidad_id, calificacion }));
    if (lista.length !== habilidades.length) {
      setError("Califica todas las habilidades del catálogo.");
      return;
    }
    setGuardando(true);
    try {
      await crearEvaluacion(pacienteId, lista, conclusiones);
      setGuardada({
        body: habilidades.map((h) => [h.nombre, calificaciones[h.id]]),
        conclusiones,
      });
      setCalificaciones({});
      setConclusiones("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la evaluación.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <p className="text-sm font-semibold">Nueva evaluación</p>
      <div className="flex flex-col gap-3">
        {habilidades.map((h) => (
          <div key={h.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">{h.nombre}</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCalificaciones((prev) => ({ ...prev, [h.id]: n }))}
                  className={`h-7 w-7 rounded-full text-xs font-semibold transition-colors ${
                    calificaciones[h.id] === n
                      ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                      : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Conclusiones
        <textarea
          value={conclusiones}
          onChange={(e) => setConclusiones(e.target.value)}
          rows={3}
          placeholder="Observaciones y conclusiones de este periodo"
          className="glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
        />
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-fit rounded-full bg-jom-ink px-5 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : "Guardar evaluación"}
        </button>

        {guardada && (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 size={13} /> Guardada
            </span>
            <DescargarTablaPDF
              label="Descargar PDF"
              titulo="Evaluación de habilidades"
              meta={[
                `Paciente: ${pacienteNombre}`,
                `Terapeuta: ${terapeutaNombre}`,
                `Fecha del reporte: ${new Date().toLocaleDateString("es-MX")}`,
              ]}
              head={["Habilidad", "Calificación"]}
              body={guardada.body}
              notaFinal={guardada.conclusiones || undefined}
              archivo={`evaluacion-${pacienteNombre.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`}
              className="text-muted inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
            />
          </>
        )}
      </div>
    </div>
  );
}
