"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Upload, Trash2, Download, Loader2, AlertCircle } from "lucide-react";
import type { Materia, PreguntaBorrador, Profile, Tema } from "@/types/database";
import { crearExamen, generarPreguntasConIA, parsearCSVExamen } from "@/app/portal/examenes/actions";

const CSV_TEMPLATE = `enunciado,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta
"¿Cuál es la unidad de fuerza en el Sistema Internacional?",Newton,Joule,Watt,Pascal,A
`;

function preguntaVacia(): PreguntaBorrador {
  return { tipo: "multiple", enunciado: "", opciones: ["", "", "", ""], respuesta_correcta: 0 };
}

export function ExamenBuilder({
  materias,
  temas,
  alumnos,
}: {
  materias: Materia[];
  temas: Tema[];
  alumnos: Profile[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [titulo, setTitulo] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [temaId, setTemaId] = useState("");
  const [preguntas, setPreguntas] = useState<PreguntaBorrador[]>([]);
  const [origen, setOrigen] = useState<"manual" | "ia" | "plantilla">("manual");
  const [destinatarios, setDestinatarios] = useState<"todos" | "seleccionados">("todos");
  const [alumnoIdsSeleccionados, setAlumnoIdsSeleccionados] = useState<string[]>([]);

  const [mostrarIA, setMostrarIA] = useState(false);
  const [tema, setTema] = useState("");
  const [cantidad, setCantidad] = useState(5);
  const [generando, setGenerando] = useState(false);
  const [subiendoCSV, setSubiendoCSV] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materiaNombre = materias.find((m) => m.id === materiaId)?.nombre ?? "";
  const temasMateria = temas.filter((t) => t.materia_id === materiaId);

  function onMateriaChange(valor: string) {
    setMateriaId(valor);
    setTemaId("");
  }

  function agregarPreguntaManual() {
    setPreguntas((prev) => [...prev, preguntaVacia()]);
  }

  function actualizarEnunciado(index: number, valor: string) {
    setPreguntas((prev) => prev.map((p, i) => (i === index ? { ...p, enunciado: valor } : p)));
  }

  function actualizarOpcion(pIndex: number, oIndex: number, valor: string) {
    setPreguntas((prev) =>
      prev.map((p, i) =>
        i === pIndex ? { ...p, opciones: p.opciones.map((o, j) => (j === oIndex ? valor : o)) } : p
      )
    );
  }

  function marcarCorrecta(pIndex: number, oIndex: number) {
    setPreguntas((prev) => prev.map((p, i) => (i === pIndex ? { ...p, respuesta_correcta: oIndex } : p)));
  }

  function cambiarTipo(pIndex: number, tipo: PreguntaBorrador["tipo"]) {
    setPreguntas((prev) => prev.map((p, i) => (i === pIndex ? { ...p, tipo } : p)));
  }

  function agregarOpcion(pIndex: number) {
    setPreguntas((prev) =>
      prev.map((p, i) => (i === pIndex && p.opciones.length < 6 ? { ...p, opciones: [...p.opciones, ""] } : p))
    );
  }

  function eliminarOpcion(pIndex: number, oIndex: number) {
    setPreguntas((prev) =>
      prev.map((p, i) => {
        if (i !== pIndex || p.opciones.length <= 2) return p;
        const opciones = p.opciones.filter((_, j) => j !== oIndex);
        const respuesta_correcta =
          p.respuesta_correcta === oIndex ? 0 : p.respuesta_correcta > oIndex ? p.respuesta_correcta - 1 : p.respuesta_correcta;
        return { ...p, opciones, respuesta_correcta };
      })
    );
  }

  function eliminarPregunta(index: number) {
    setPreguntas((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleAlumno(id: string) {
    setAlumnoIdsSeleccionados((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function generarConIA() {
    setError(null);
    if (!materiaId) {
      setError("Selecciona una materia antes de generar preguntas con IA.");
      return;
    }
    if (!tema.trim()) {
      setError("Describe el tema del examen.");
      return;
    }
    setGenerando(true);
    try {
      const nuevas = await generarPreguntasConIA({ materiaNombre, tema, cantidad });
      setPreguntas((prev) => [...prev, ...nuevas]);
      setOrigen("ia");
      setMostrarIA(false);
      setTema("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron generar las preguntas.");
    } finally {
      setGenerando(false);
    }
  }

  async function subirCSV(e: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendoCSV(true);
    try {
      const formData = new FormData();
      formData.set("archivo", file);
      const nuevas = await parsearCSVExamen(formData);
      setPreguntas((prev) => [...prev, ...nuevas]);
      setOrigen("plantilla");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo leer el CSV.");
    } finally {
      setSubiendoCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function descargarPlantilla() {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-examen.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function guardar() {
    setError(null);
    if (!titulo.trim()) {
      setError("Ponle un título al examen.");
      return;
    }
    if (!materiaId) {
      setError("Selecciona una materia.");
      return;
    }
    if (preguntas.length === 0) {
      setError("Agrega al menos una pregunta.");
      return;
    }
    if (destinatarios === "seleccionados" && alumnoIdsSeleccionados.length === 0) {
      setError("Selecciona al menos un alumno, o cambia a \"Todos los alumnos\".");
      return;
    }
    setGuardando(true);
    try {
      await crearExamen({
        titulo,
        materia_id: materiaId,
        tema_id: temaId || null,
        origen,
        preguntas,
        alumnoIds: destinatarios === "seleccionados" ? alumnoIdsSeleccionados : undefined,
      });
      router.push("/portal/examenes");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el examen.");
      setGuardando(false);
    }
  }

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1.5 text-sm">
        Título del examen
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Examen parcial: Cinemática"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Materia
        <select value={materiaId} onChange={(e) => onMateriaChange(e.target.value)} className={inputClass}>
          <option value="">Selecciona una materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Tema del temario (opcional)
        <select
          value={temaId}
          onChange={(e) => setTemaId(e.target.value)}
          disabled={!materiaId}
          className={`${inputClass} disabled:opacity-60`}
        >
          <option value="">Sin vincular a un tema</option>
          {temasMateria.map((t) => (
            <option key={t.id} value={t.id}>
              {t.titulo}
            </option>
          ))}
        </select>
      </label>

      <div className="glass flex flex-col gap-3 rounded-2xl p-4">
        <p className="text-sm font-medium">Destinatarios</p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setDestinatarios("todos")}
            className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
              destinatarios === "todos"
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            Todos los alumnos
          </button>
          <button
            type="button"
            onClick={() => setDestinatarios("seleccionados")}
            className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
              destinatarios === "seleccionados"
                ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
            }`}
          >
            Alumnos seleccionados
          </button>
        </div>

        {destinatarios === "seleccionados" &&
          (alumnos.length === 0 ? (
            <p className="text-muted text-xs">No hay alumnos registrados todavía.</p>
          ) : (
            <div className="flex flex-col gap-1 rounded-xl bg-black/5 p-2 dark:bg-white/5">
              {alumnos.map((a) => (
                <label key={a.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10">
                  <input
                    type="checkbox"
                    checked={alumnoIdsSeleccionados.includes(a.id)}
                    onChange={() => toggleAlumno(a.id)}
                  />
                  {a.nombre_completo}
                </label>
              ))}
            </div>
          ))}
      </div>

      <div className="glass flex flex-col gap-3 rounded-2xl p-4">
        <p className="text-sm font-medium">Agregar preguntas</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={agregarPreguntaManual}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Plus size={14} /> Pregunta manual
          </button>
          <button
            type="button"
            onClick={() => setMostrarIA((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <Sparkles size={14} /> Generar con IA
          </button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
            {subiendoCSV ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Subir CSV
            <input ref={fileInputRef} type="file" accept=".csv" onChange={subirCSV} className="hidden" />
          </label>
          <button
            type="button"
            onClick={descargarPlantilla}
            className="text-muted inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium underline underline-offset-2 hover:text-fg"
          >
            <Download size={14} /> Plantilla CSV
          </button>
        </div>

        {mostrarIA && (
          <div className="flex flex-col gap-3 rounded-xl bg-black/5 p-3 dark:bg-white/5">
            <label className="flex flex-col gap-1.5 text-sm">
              Tema
              <input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej. Leyes de Newton"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              Cantidad de preguntas
              <input
                type="number"
                min={1}
                max={20}
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className={`${inputClass} w-24`}
              />
            </label>
            <button
              type="button"
              onClick={generarConIA}
              disabled={generando}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              {generando ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {generando ? "Generando…" : "Generar preguntas"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {preguntas.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-muted text-xs uppercase">{preguntas.length} preguntas</p>
          {preguntas.map((pregunta, pIndex) => (
            <div key={pIndex} className="glass flex flex-col gap-3 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted text-xs font-medium">Pregunta {pIndex + 1}</span>
                <button
                  type="button"
                  onClick={() => eliminarPregunta(pIndex)}
                  aria-label="Eliminar pregunta"
                  className="text-muted rounded-full p-1 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => cambiarTipo(pIndex, "multiple")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    pregunta.tipo === "multiple"
                      ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                      : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                  }`}
                >
                  Opción múltiple
                </button>
                <button
                  type="button"
                  onClick={() => cambiarTipo(pIndex, "abierta")}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    pregunta.tipo === "abierta"
                      ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                      : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
                  }`}
                >
                  Abierta
                </button>
              </div>

              <textarea
                value={pregunta.enunciado}
                onChange={(e) => actualizarEnunciado(pIndex, e.target.value)}
                placeholder="Enunciado de la pregunta"
                rows={2}
                className={inputClass}
              />

              {pregunta.tipo === "multiple" ? (
                <>
                  <div className="flex flex-col gap-2">
                    {pregunta.opciones.map((opcion, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correcta-${pIndex}`}
                          checked={pregunta.respuesta_correcta === oIndex}
                          onChange={() => marcarCorrecta(pIndex, oIndex)}
                          aria-label={`Marcar opción ${oIndex + 1} como correcta`}
                        />
                        <input
                          value={opcion}
                          onChange={(e) => actualizarOpcion(pIndex, oIndex, e.target.value)}
                          placeholder={`Opción ${oIndex + 1}`}
                          className={`${inputClass} flex-1 py-2`}
                        />
                        {pregunta.opciones.length > 2 && (
                          <button
                            type="button"
                            onClick={() => eliminarOpcion(pIndex, oIndex)}
                            aria-label="Eliminar opción"
                            className="text-muted rounded-full p-1 hover:text-jom-ink"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    {pregunta.opciones.length < 6 && (
                      <button
                        type="button"
                        onClick={() => agregarOpcion(pIndex)}
                        className="text-muted w-fit text-xs underline underline-offset-2 hover:text-fg"
                      >
                        + Agregar opción
                      </button>
                    )}
                  </div>
                  <p className="text-muted text-xs">Marca con el círculo cuál opción es la correcta.</p>
                </>
              ) : (
                <p className="text-muted text-xs">
                  El alumno responderá con texto libre. No se autocalifica: tú la revisas manualmente.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : "Guardar examen"}
      </button>
    </div>
  );
}
