"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PreguntaBorrador } from "@/types/database";

function preguntaVacia(): PreguntaBorrador {
  return { tipo: "multiple", enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: 0 };
}

// Serializa su estado en un <input type="hidden"> para poder enviarse
// dentro del mismo <form> nativo de Nueva/Editar tarea (junto con los
// archivos, que sí necesitan FormData real).
export function PreguntasTareaEditor({ inicial = [] }: { inicial?: PreguntaBorrador[] }) {
  const [preguntas, setPreguntas] = useState<PreguntaBorrador[]>(inicial);

  function agregar() {
    setPreguntas((prev) => [...prev, preguntaVacia()]);
  }
  function eliminar(i: number) {
    setPreguntas((prev) => prev.filter((_, idx) => idx !== i));
  }
  function actualizarEnunciado(i: number, valor: string) {
    setPreguntas((prev) => prev.map((p, idx) => (idx === i ? { ...p, enunciado: valor } : p)));
  }
  function cambiarTipo(i: number, tipo: PreguntaBorrador["tipo"]) {
    setPreguntas((prev) => prev.map((p, idx) => (idx === i ? { ...p, tipo } : p)));
  }
  function actualizarOpcion(i: number, oi: number, valor: string) {
    setPreguntas((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, opciones: p.opciones.map((o, j) => (j === oi ? valor : o)) } : p))
    );
  }
  function marcarCorrecta(i: number, oi: number) {
    setPreguntas((prev) => prev.map((p, idx) => (idx === i ? { ...p, respuesta_correcta: oi } : p)));
  }

  const inputClass =
    "glass rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="preguntas_json" value={JSON.stringify(preguntas)} />
      {preguntas.map((pregunta, i) => (
        <div key={i} className="glass flex flex-col gap-2 rounded-xl p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted text-xs font-medium">Pregunta {i + 1}</span>
            <button
              type="button"
              onClick={() => eliminar(i)}
              aria-label="Eliminar pregunta"
              className="text-muted rounded-full p-1 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
            >
              <Trash2 size={13} />
            </button>
          </div>

          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => cambiarTipo(i, "multiple")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                pregunta.tipo === "multiple"
                  ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              Opción múltiple
            </button>
            <button
              type="button"
              onClick={() => cambiarTipo(i, "abierta")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                pregunta.tipo === "abierta"
                  ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              Abierta
            </button>
          </div>

          <input
            value={pregunta.enunciado}
            onChange={(e) => actualizarEnunciado(i, e.target.value)}
            placeholder={`Enunciado de la pregunta ${i + 1}`}
            className={inputClass}
          />

          {pregunta.tipo === "multiple" ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {pregunta.opciones.map((op, oi) => (
                <label key={oi} className="flex items-center gap-2 text-xs">
                  <input
                    type="radio"
                    name={`correcta-${i}`}
                    checked={pregunta.respuesta_correcta === oi}
                    onChange={() => marcarCorrecta(i, oi)}
                    aria-label={`Marcar opción ${oi + 1} como correcta`}
                  />
                  <input
                    value={op}
                    onChange={(e) => actualizarOpcion(i, oi, e.target.value)}
                    placeholder={`Opción ${oi + 1}`}
                    className={`${inputClass} flex-1 py-1.5`}
                  />
                </label>
              ))}
            </div>
          ) : (
            <p className="text-muted text-xs">El alumno responderá con texto libre; tú la revisas manualmente.</p>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={agregar}
        className="text-muted inline-flex w-fit items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        <Plus size={13} /> Agregar pregunta
      </button>
    </div>
  );
}
