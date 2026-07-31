"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import type { ExamenPreguntaAlumno } from "@/types/database";
import { entregarExamen } from "@/app/portal/examenes/actions";

export function TomarExamenForm({
  examenId,
  preguntas,
}: {
  examenId: string;
  preguntas: ExamenPreguntaAlumno[];
}) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setError(null);
    if (Object.keys(respuestas).length < preguntas.length) {
      setError("Responde todas las preguntas antes de entregar.");
      return;
    }
    setEnviando(true);
    try {
      await entregarExamen(examenId, respuestas);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo entregar el examen.");
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {preguntas.map((pregunta, i) => (
        <div key={pregunta.id} className="glass rounded-2xl p-4">
          <p className="text-sm font-medium">
            {i + 1}. {pregunta.enunciado}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {pregunta.opciones.map((opcion, oIndex) => (
              <label
                key={oIndex}
                className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-opacity hover:opacity-80"
              >
                <input
                  type="radio"
                  name={`pregunta-${pregunta.id}`}
                  checked={respuestas[pregunta.id] === oIndex}
                  onChange={() => setRespuestas((prev) => ({ ...prev, [pregunta.id]: oIndex }))}
                />
                {opcion}
              </label>
            ))}
          </div>
        </div>
      ))}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {enviando ? "Entregando…" : "Entregar examen"}
      </button>
    </div>
  );
}
