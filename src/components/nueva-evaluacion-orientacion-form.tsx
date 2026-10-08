"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { crearEvaluacionOrientacion } from "@/app/portal/evaluaciones-orientacion/actions";
import { DescargarTablaPDF } from "@/components/descargar-tabla-pdf";
import type { OrientacionAtributo } from "@/types/database";

export function NuevaEvaluacionOrientacionForm({
  orientadoId,
  orientadoNombre,
  sesionId,
  sesionFechaLabel,
  coachNombre,
  atributos,
}: {
  orientadoId: string;
  orientadoNombre: string;
  sesionId: string;
  sesionFechaLabel: string;
  coachNombre: string;
  atributos: OrientacionAtributo[];
}) {
  const router = useRouter();
  const [calificaciones, setCalificaciones] = useState<Record<string, number>>({});
  const [conclusiones, setConclusiones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardada, setGuardada] = useState<{ body: (string | number)[][]; conclusiones: string } | null>(null);

  async function guardar() {
    setError(null);
    const lista = Object.entries(calificaciones).map(([atributo_id, calificacion]) => ({ atributo_id, calificacion }));
    if (lista.length !== atributos.length) {
      setError("Califica todos los atributos del catálogo.");
      return;
    }
    setGuardando(true);
    try {
      const resultado = await crearEvaluacionOrientacion(orientadoId, sesionId, lista, conclusiones);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setGuardada({ body: atributos.map((a) => [a.nombre, calificaciones[a.id]]), conclusiones });
      router.refresh();
    } catch {
      setError("No se pudo guardar la evaluación. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div>
        <p className="text-sm font-semibold">Nueva evaluación</p>
        <p className="text-muted text-xs">Sesión del {sesionFechaLabel}</p>
      </div>
      <div className="flex flex-col gap-3">
        {atributos.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm">{a.nombre}</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCalificaciones((prev) => ({ ...prev, [a.id]: n }))}
                  className={`h-7 w-7 rounded-full text-xs font-semibold transition-colors ${
                    calificaciones[a.id] === n
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
          placeholder="Observaciones y conclusiones de esta sesión"
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
          disabled={guardando || !!guardada}
          className="w-fit rounded-full bg-jom-ink px-5 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : guardada ? "Guardada" : "Guardar evaluación"}
        </button>

        {guardada && (
          <>
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <CheckCircle2 size={13} /> Guardada
            </span>
            <DescargarTablaPDF
              label="Descargar PDF"
              titulo="Evaluación de orientación vocacional"
              meta={[`Orientado: ${orientadoNombre}`, `Coach: ${coachNombre}`, `Sesión: ${sesionFechaLabel}`]}
              head={["Atributo", "Calificación"]}
              body={guardada.body}
              notaFinal={guardada.conclusiones || undefined}
              archivo={`evaluacion-${orientadoNombre.toLowerCase().replace(/\s+/g, "-")}-${sesionId.slice(0, 8)}.pdf`}
              className="text-muted inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
            />
          </>
        )}
      </div>
    </div>
  );
}
