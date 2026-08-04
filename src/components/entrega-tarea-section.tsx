"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Trash2, Upload, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { subirArchivoEntrega } from "@/lib/subir-archivo-entrega";
import {
  eliminarArchivoEntrega,
  guardarRespuestaTextoEntrega,
  obtenerPreguntasTarea,
  entregarPreguntasTarea,
} from "@/app/portal/tareas/entrega-actions";
import { formatBytes } from "@/lib/storage";
import type { TareaIntento, TareaPreguntaAlumno } from "@/types/database";

const FORMATOS_PERMITIDOS = ".jpg,.jpeg,.png,.heic,.pdf,.doc,.docx";

type ArchivoEvidencia = {
  id: string;
  nombre_archivo: string;
  tamano_bytes: number | null;
  url: string | null;
};

export function EntregaTareaSection({
  tareaId,
  alumnoId,
  archivosIniciales,
  pideRespuestaTexto,
  respuestaTextoInicial,
  tienePreguntas,
  intentoInicial,
}: {
  tareaId: string;
  alumnoId: string;
  archivosIniciales: ArchivoEvidencia[];
  pideRespuestaTexto: boolean;
  respuestaTextoInicial: string;
  tienePreguntas: boolean;
  intentoInicial: TareaIntento | null;
}) {
  const router = useRouter();

  // Evidencia
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  // Respuesta de texto
  const [respuestaTexto, setRespuestaTexto] = useState(respuestaTextoInicial);
  const [guardandoTexto, setGuardandoTexto] = useState(false);
  const [textoGuardado, setTextoGuardado] = useState(false);

  // Preguntas
  const [mostrarPreguntas, setMostrarPreguntas] = useState(false);
  const [cargandoPreguntas, setCargandoPreguntas] = useState(false);
  const [preguntas, setPreguntas] = useState<TareaPreguntaAlumno[] | null>(null);
  const [respuestasPreguntas, setRespuestasPreguntas] = useState<Record<string, number | string>>({});
  const [enviandoPreguntas, setEnviandoPreguntas] = useState(false);
  const [errorPreguntas, setErrorPreguntas] = useState<string | null>(null);
  const [intento, setIntento] = useState(intentoInicial);

  async function subirArchivos(files: FileList) {
    setErrorArchivo(null);
    setSubiendo(true);
    try {
      for (const archivo of Array.from(files)) {
        await subirArchivoEntrega(tareaId, alumnoId, archivo);
      }
      router.refresh();
    } catch (e) {
      setErrorArchivo(e instanceof Error ? e.message : "No se pudo subir el archivo.");
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function borrarArchivo(archivoId: string) {
    try {
      await eliminarArchivoEntrega(archivoId);
      router.refresh();
    } catch (e) {
      setErrorArchivo(e instanceof Error ? e.message : "No se pudo borrar el archivo.");
    }
  }

  async function guardarTexto() {
    setGuardandoTexto(true);
    try {
      await guardarRespuestaTextoEntrega(tareaId, respuestaTexto);
      setTextoGuardado(true);
      router.refresh();
    } finally {
      setGuardandoTexto(false);
    }
  }

  async function abrirPreguntas() {
    setMostrarPreguntas(true);
    if (preguntas || intento) return;
    setCargandoPreguntas(true);
    try {
      const resultado = await obtenerPreguntasTarea(tareaId);
      if (resultado.yaPresentado) {
        setIntento(resultado.intento);
      } else {
        setPreguntas(resultado.preguntas);
      }
    } catch (e) {
      setErrorPreguntas(e instanceof Error ? e.message : "No se pudieron cargar las preguntas.");
    } finally {
      setCargandoPreguntas(false);
    }
  }

  function faltanPreguntas() {
    if (!preguntas) return true;
    return preguntas.some((p) => {
      const r = respuestasPreguntas[p.id];
      if (p.tipo === "abierta") return typeof r !== "string" || !r.trim();
      return r === undefined;
    });
  }

  async function entregarPreguntas() {
    setErrorPreguntas(null);
    if (faltanPreguntas()) {
      setErrorPreguntas("Responde todas las preguntas antes de entregar.");
      return;
    }
    setEnviandoPreguntas(true);
    try {
      const resultado = await entregarPreguntasTarea(tareaId, respuestasPreguntas);
      setIntento({
        id: "",
        tarea_id: tareaId,
        alumno_id: alumnoId,
        respuestas: respuestasPreguntas,
        aciertos: resultado.aciertos,
        total: resultado.total,
        calificacion: resultado.calificacion,
        created_at: new Date().toISOString(),
      });
      router.refresh();
    } catch (e) {
      setErrorPreguntas(e instanceof Error ? e.message : "No se pudo entregar.");
    } finally {
      setEnviandoPreguntas(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-4 border-t border-black/5 pt-3 dark:border-white/5">
      {/* Evidencia en archivo */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium">Evidencia (evidencia de que completaste la tarea)</p>
        {archivosIniciales.length > 0 && (
          <div className="flex flex-col gap-1.5">
            {archivosIniciales.map((a) => (
              <div key={a.id} className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-xs">
                <Paperclip size={13} className="text-muted shrink-0" />
                <a href={a.url ?? "#"} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">
                  {a.nombre_archivo}
                </a>
                {a.tamano_bytes && <span className="text-muted shrink-0">{formatBytes(a.tamano_bytes)}</span>}
                <button
                  type="button"
                  onClick={() => borrarArchivo(a.id)}
                  aria-label="Eliminar archivo"
                  className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/30 hover:text-jom-ink"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-black/5 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15">
          {subiendo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {subiendo ? "Subiendo…" : "Subir evidencia"}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={FORMATOS_PERMITIDOS}
            onChange={(e) => e.target.files && subirArchivos(e.target.files)}
            className="hidden"
          />
        </label>
        <p className="text-muted text-xs">Formatos permitidos: JPG, PNG, HEIC, PDF, Word (.doc, .docx). Puedes subir varios archivos.</p>
        {errorArchivo && (
          <p className="flex items-center gap-1 text-xs text-red-500">
            <AlertCircle size={12} /> {errorArchivo}
          </p>
        )}
      </div>

      {/* Respuesta de texto */}
      {pideRespuestaTexto && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium">Tu respuesta</p>
          <textarea
            value={respuestaTexto}
            onChange={(e) => {
              setRespuestaTexto(e.target.value);
              setTextoGuardado(false);
            }}
            rows={3}
            placeholder="Escribe tu respuesta"
            className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <button
            type="button"
            onClick={guardarTexto}
            disabled={guardandoTexto}
            className="w-fit rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            {guardandoTexto ? "Guardando…" : textoGuardado ? "Guardado ✓" : "Guardar respuesta"}
          </button>
        </div>
      )}

      {/* Preguntas */}
      {tienePreguntas && (
        <div className="flex flex-col gap-2">
          {!mostrarPreguntas ? (
            <button
              type="button"
              onClick={abrirPreguntas}
              className="inline-flex w-fit items-center gap-1.5 rounded-full bg-jom-yellow/40 px-3.5 py-1.5 text-xs font-semibold text-jom-ink transition-opacity hover:opacity-90"
            >
              <Sparkles size={13} /> Responder preguntas
            </button>
          ) : cargandoPreguntas ? (
            <p className="text-muted text-xs">Cargando preguntas…</p>
          ) : intento ? (
            <div className="glass rounded-xl p-3 text-sm">
              <p className="font-medium">
                {intento.calificacion !== null ? `Calificación: ${intento.calificacion}%` : "Respuestas entregadas — pendiente de revisión"}
              </p>
              {intento.total > 0 && (
                <p className="text-muted text-xs">
                  {intento.aciertos} de {intento.total} correctas
                </p>
              )}
            </div>
          ) : preguntas ? (
            <div className="flex flex-col gap-2">
              {preguntas.map((p, i) => (
                <div key={p.id} className="glass rounded-xl p-3">
                  <p className="text-sm font-medium">
                    {i + 1}. {p.enunciado}
                  </p>
                  {p.tipo === "abierta" ? (
                    <textarea
                      value={typeof respuestasPreguntas[p.id] === "string" ? (respuestasPreguntas[p.id] as string) : ""}
                      onChange={(e) => setRespuestasPreguntas((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      rows={2}
                      placeholder="Escribe tu respuesta"
                      className="glass mt-2 w-full rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
                    />
                  ) : (
                    <div className="mt-2 flex flex-col gap-1">
                      {(p.opciones ?? []).map((op, oi) => (
                        <label key={oi} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={`tp-${p.id}`}
                            checked={respuestasPreguntas[p.id] === oi}
                            onChange={() => setRespuestasPreguntas((prev) => ({ ...prev, [p.id]: oi }))}
                          />
                          {op}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {errorPreguntas && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle size={12} /> {errorPreguntas}
                </p>
              )}
              <button
                type="button"
                onClick={entregarPreguntas}
                disabled={enviandoPreguntas}
                className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
              >
                {enviandoPreguntas ? "Entregando…" : "Entregar respuestas"}
              </button>
            </div>
          ) : (
            errorPreguntas && (
              <p className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle size={12} /> {errorPreguntas}
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
