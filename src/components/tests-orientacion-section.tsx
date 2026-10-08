"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, Link2, Trash2, AlertCircle, X } from "lucide-react";
import { subirTestOrientacion } from "@/lib/subir-test-orientacion";
import { eliminarTestOrientacion, responderTestOrientacion, evaluarTestOrientacion } from "@/app/portal/orientados/actions";
import { formatBytes } from "@/lib/storage";
import type { OrientacionTest, OrientacionTestPregunta, OrientacionTestRespuesta } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

type Estado = "disponible" | "contestado" | "evaluado";

function estadoTest(test: OrientacionTest, respuesta: OrientacionTestRespuesta | null): Estado {
  if (test.resultado) return "evaluado";
  if (respuesta) return "contestado";
  return "disponible";
}

const ESTADO_LABEL: Record<Estado, string> = { disponible: "Disponible", contestado: "Contestado", evaluado: "Evaluado" };
const ESTADO_CLASS: Record<Estado, string> = {
  disponible: "bg-black/5 dark:bg-white/10 text-muted",
  contestado: "bg-jom-yellow/40 text-jom-ink",
  evaluado: "bg-jom-pink/30 text-jom-ink",
};

type PreguntaBorrador = { enunciado: string; opciones: string[] };

function preguntaVacia(): PreguntaBorrador {
  return { enunciado: "", opciones: ["", ""] };
}

function PreguntaBorradorEditor({
  pregunta,
  onCambiar,
  onEliminar,
}: {
  pregunta: PreguntaBorrador;
  onCambiar: (p: PreguntaBorrador) => void;
  onEliminar: () => void;
}) {
  const inputClass =
    "glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-black/5 p-3 dark:bg-white/5">
      <div className="flex items-start gap-2">
        <textarea
          value={pregunta.enunciado}
          onChange={(e) => onCambiar({ ...pregunta, enunciado: e.target.value })}
          placeholder="Ej. Preferirías trabajar con números o con personas"
          rows={1}
          className={`${inputClass} flex-1`}
        />
        <button type="button" onClick={onEliminar} aria-label="Eliminar pregunta" className="text-muted shrink-0 rounded-full p-1 hover:text-jom-pink">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="flex flex-col gap-1.5 pl-1">
        {pregunta.opciones.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={o}
              onChange={(e) =>
                onCambiar({ ...pregunta, opciones: pregunta.opciones.map((op, j) => (j === i ? e.target.value : op)) })
              }
              placeholder={`Opción ${i + 1}`}
              className={`${inputClass} flex-1 py-1.5`}
            />
            {pregunta.opciones.length > 2 && (
              <button
                type="button"
                onClick={() => onCambiar({ ...pregunta, opciones: pregunta.opciones.filter((_, j) => j !== i) })}
                aria-label="Eliminar opción"
                className="text-muted rounded-full p-1 hover:text-jom-pink"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {pregunta.opciones.length < 6 && (
          <button
            type="button"
            onClick={() => onCambiar({ ...pregunta, opciones: [...pregunta.opciones, ""] })}
            className="text-muted w-fit text-xs underline underline-offset-2 hover:text-fg"
          >
            + Agregar opción
          </button>
        )}
      </div>
    </div>
  );
}

function AlumnoResponderTest({ test, preguntas }: { test: OrientacionTest; preguntas: OrientacionTestPregunta[] }) {
  const router = useRouter();
  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar() {
    setError(null);
    if (Object.keys(respuestas).length < preguntas.length) {
      setError("Responde todas las preguntas antes de enviar.");
      return;
    }
    setEnviando(true);
    try {
      const ordenadas = [...preguntas].sort((a, b) => a.orden - b.orden);
      const resultado = await responderTestOrientacion(
        test.id,
        ordenadas.map((p) => respuestas[p.id])
      );
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo enviar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {[...preguntas]
        .sort((a, b) => a.orden - b.orden)
        .map((p, i) => (
          <div key={p.id} className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">
              {i + 1}. {p.enunciado}
            </p>
            <div className="flex flex-col gap-1">
              {p.opciones.map((o, oIndex) => (
                <label key={oIndex} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`pregunta-${p.id}`}
                    checked={respuestas[p.id] === oIndex}
                    onChange={() => setRespuestas((prev) => ({ ...prev, [p.id]: oIndex }))}
                  />
                  {o}
                </label>
              ))}
            </div>
          </div>
        ))}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      <button
        type="button"
        onClick={enviar}
        disabled={enviando}
        className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {enviando ? "Enviando…" : "Enviar respuestas"}
      </button>
    </div>
  );
}

function CoachEvaluarTest({
  test,
  orientadoId,
  preguntas,
  respuesta,
}: {
  test: OrientacionTest;
  orientadoId: string;
  preguntas: OrientacionTestPregunta[];
  respuesta: OrientacionTestRespuesta;
}) {
  const router = useRouter();
  const [resultado, setResultado] = useState(test.resultado ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ordenadas = [...preguntas].sort((a, b) => a.orden - b.orden);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const r = await evaluarTestOrientacion(test.id, orientadoId, resultado);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5">
        {ordenadas.map((p, i) => (
          <p key={p.id} className="text-sm">
            <span className="text-muted">{i + 1}. {p.enunciado}:</span> {p.opciones[respuesta.respuestas[i]] ?? "—"}
          </p>
        ))}
      </div>
      <textarea
        value={resultado}
        onChange={(e) => setResultado(e.target.value)}
        rows={2}
        placeholder="Interpretación / perfil resultante"
        className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
      />
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}
      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-fit rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : "Marcar como evaluado"}
      </button>
    </div>
  );
}

export function TestsOrientacionSection({
  orientadoId,
  tests,
  urlPorArchivo,
  preguntasPorTest = {},
  respuestaPorTest = {},
  soloLectura = false,
  puedeResponder = false,
}: {
  orientadoId: string;
  tests: OrientacionTest[];
  urlPorArchivo: Record<string, string>;
  preguntasPorTest?: Record<string, OrientacionTestPregunta[]>;
  respuestaPorTest?: Record<string, OrientacionTestRespuesta | null>;
  soloLectura?: boolean;
  puedeResponder?: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [modo, setModo] = useState<"archivo" | "link" | "interactivo">("archivo");
  const [nombreTest, setNombreTest] = useState("");
  const [resultado, setResultado] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [url, setUrl] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preguntas, setPreguntas] = useState<PreguntaBorrador[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  function resetForm() {
    setNombreTest("");
    setResultado("");
    setInstrucciones("");
    setUrl("");
    setArchivo(null);
    setPreguntas([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMostrarForm(false);
  }

  async function guardar() {
    setError(null);
    if (!nombreTest.trim()) {
      setError("Indica el nombre del test.");
      return;
    }
    if (modo === "link" && !url.trim()) {
      setError("Pega el link del test.");
      return;
    }
    if (modo === "archivo" && !archivo) {
      setError("Selecciona un archivo.");
      return;
    }
    if (modo === "interactivo" && preguntas.filter((p) => p.enunciado.trim() && p.opciones.filter((o) => o.trim()).length >= 2).length === 0) {
      setError("Agrega al menos una pregunta con dos opciones.");
      return;
    }
    setGuardando(true);
    try {
      await subirTestOrientacion(
        orientadoId,
        { nombre_test: nombreTest, resultado, instrucciones, fecha, modo, url: modo === "link" ? url : null, preguntas },
        archivo
      );
      resetForm();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el test.");
    } finally {
      setGuardando(false);
    }
  }

  async function borrar(id: string) {
    if (!window.confirm("¿Eliminar este test? Esta acción no se puede deshacer.")) return;
    setBorrandoId(id);
    try {
      const resultadoDelete = await eliminarTestOrientacion(id, orientadoId);
      if (!resultadoDelete.ok) {
        setError(resultadoDelete.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo eliminar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Tests vocacionales</p>
        {!soloLectura && !mostrarForm && (
          <button
            type="button"
            onClick={() => setMostrarForm(true)}
            className="text-muted inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:bg-white/10"
          >
            <Plus size={12} /> Agregar test
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="glass flex flex-col gap-2 rounded-xl p-3">
          <div className="flex gap-1.5">
            {(["archivo", "link", "interactivo"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  modo === m ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                }`}
              >
                {m === "archivo" ? "Subir archivo" : m === "link" ? "Link" : "Armar preguntas"}
              </button>
            ))}
          </div>

          <input value={nombreTest} onChange={(e) => setNombreTest(e.target.value)} placeholder="Nombre del test (ej. Kuder, CHASIDE)" className={inputClass} />

          {modo !== "interactivo" && (
            <textarea
              value={resultado}
              onChange={(e) => setResultado(e.target.value)}
              rows={3}
              placeholder="Instrucciones de la evaluación (opcional)"
              className={inputClass}
            />
          )}

          {modo === "interactivo" && (
            <textarea
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
              rows={2}
              placeholder="Instrucciones generales (opcional, ej. 'elige la opción que más te identifique')"
              className={inputClass}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
            {modo === "archivo" && (
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="glass flex-1 rounded-xl px-3 py-2 text-xs file:mr-3 file:rounded-full file:border-0 file:bg-jom-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-jom-white dark:file:bg-jom-white dark:file:text-jom-ink"
              />
            )}
            {modo === "link" && (
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={`${inputClass} flex-1`} />
            )}
          </div>

          {modo === "interactivo" && (
            <div className="flex flex-col gap-2">
              <p className="text-muted text-xs">Preguntas de preferencia, sin respuesta correcta. El alumno elige una opción por pregunta.</p>
              {preguntas.map((p, i) => (
                <PreguntaBorradorEditor
                  key={i}
                  pregunta={p}
                  onCambiar={(np) => setPreguntas((prev) => prev.map((pp, j) => (j === i ? np : pp)))}
                  onEliminar={() => setPreguntas((prev) => prev.filter((_, j) => j !== i))}
                />
              ))}
              <button
                type="button"
                onClick={() => setPreguntas((prev) => [...prev, preguntaVacia()])}
                className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium hover:bg-black/10 dark:bg-white/10"
              >
                <Plus size={12} /> Agregar pregunta
              </button>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={resetForm} className="text-muted text-xs underline underline-offset-2">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {tests.length === 0 ? (
        <p className="text-muted text-sm">Todavía no hay tests registrados.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {tests.map((t) => {
            const preguntasTest = preguntasPorTest[t.id] ?? [];
            const respuestaTest = respuestaPorTest[t.id] ?? null;
            const estado = t.modo === "interactivo" ? estadoTest(t, respuestaTest) : null;

            return (
              <div key={t.id} className="glass flex flex-col gap-1.5 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">{t.nombre_test}</p>
                      {estado && (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CLASS[estado]}`}>{ESTADO_LABEL[estado]}</span>
                      )}
                    </div>
                    <p className="text-muted text-xs">{formatFecha(t.fecha)}</p>
                  </div>
                  {!soloLectura && (
                    <button
                      type="button"
                      onClick={() => borrar(t.id)}
                      disabled={borrandoId === t.id}
                      aria-label="Eliminar test"
                      className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                {t.resultado && <p className="text-sm">{t.resultado}</p>}
                {t.modo === "interactivo" && t.instrucciones && <p className="text-muted text-sm">{t.instrucciones}</p>}

                {t.modo === "archivo" && t.storage_path && (
                  <a
                    href={urlPorArchivo[t.storage_path] ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1.5 text-xs text-jom-pink hover:underline"
                  >
                    <FileText size={12} /> {t.nombre_archivo}
                    {t.tamano_bytes && <span className="text-muted">{formatBytes(t.tamano_bytes)}</span>}
                  </a>
                )}

                {t.modo === "link" && t.url && (
                  <a href={t.url} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1.5 text-xs text-jom-pink hover:underline">
                    <Link2 size={12} /> {t.url}
                  </a>
                )}

                {t.modo === "interactivo" && estado === "disponible" && puedeResponder && (
                  <AlumnoResponderTest test={t} preguntas={preguntasTest} />
                )}
                {t.modo === "interactivo" && estado === "disponible" && !puedeResponder && !soloLectura && (
                  <p className="text-muted text-xs">Esperando respuesta del alumno.</p>
                )}
                {t.modo === "interactivo" && estado === "contestado" && puedeResponder && (
                  <p className="text-muted text-xs">Ya respondiste. Tu coach todavía no evaluó el resultado.</p>
                )}
                {t.modo === "interactivo" && estado === "contestado" && !soloLectura && respuestaTest && (
                  <CoachEvaluarTest test={t} orientadoId={orientadoId} preguntas={preguntasTest} respuesta={respuestaTest} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
