"use client";

import { useMemo, useState } from "react";
import type { Examen, Materia, Profile, Tarea, Tema } from "@/types/database";
import { crearCalificacion } from "@/app/portal/calificaciones/actions";

export function CalificacionForm({
  materias,
  temas,
  tareas,
  examenes,
  alumnos,
  tareaIdPreseleccionada,
  alumnoIdPreseleccionado,
}: {
  materias: Materia[];
  temas: Tema[];
  tareas: Tarea[];
  examenes: Examen[];
  alumnos: Profile[];
  tareaIdPreseleccionada: string | null;
  alumnoIdPreseleccionado: string | null;
}) {
  const tareaPre = tareaIdPreseleccionada ? (tareas.find((t) => t.id === tareaIdPreseleccionada) ?? null) : null;

  const [materiaId, setMateriaId] = useState(tareaPre?.materia_id ?? "");
  const [seleccion, setSeleccion] = useState(tareaPre ? `tarea:${tareaPre.id}` : "");
  const [tituloManual, setTituloManual] = useState("");

  const tareasDeLaMateria = useMemo(() => tareas.filter((t) => t.materia_id === materiaId), [tareas, materiaId]);
  const examenesDeLaMateria = useMemo(() => examenes.filter((e) => e.materia_id === materiaId), [examenes, materiaId]);
  const temasDeLaMateria = useMemo(() => temas.filter((t) => t.materia_id === materiaId), [temas, materiaId]);

  // Agrupa tareas y exámenes de la materia por tema, para que el menú se
  // vea organizado igual que el Temario. "Sin tema asignado" al final.
  const grupos = useMemo(() => {
    const porTema = new Map<string, { titulo: string; tareas: Tarea[]; examenes: Examen[] }>();
    const claveSinTema = "__sin_tema__";
    for (const tema of temasDeLaMateria) {
      porTema.set(tema.id, { titulo: tema.titulo, tareas: [], examenes: [] });
    }
    for (const t of tareasDeLaMateria) {
      const clave = t.tema_id && porTema.has(t.tema_id) ? t.tema_id : claveSinTema;
      if (!porTema.has(clave)) porTema.set(clave, { titulo: "Sin tema asignado", tareas: [], examenes: [] });
      porTema.get(clave)!.tareas.push(t);
    }
    for (const e of examenesDeLaMateria) {
      const clave = e.tema_id && porTema.has(e.tema_id) ? e.tema_id : claveSinTema;
      if (!porTema.has(clave)) porTema.set(clave, { titulo: "Sin tema asignado", tareas: [], examenes: [] });
      porTema.get(clave)!.examenes.push(e);
    }
    return [...porTema.entries()].filter(([, g]) => g.tareas.length > 0 || g.examenes.length > 0);
  }, [temasDeLaMateria, tareasDeLaMateria, examenesDeLaMateria]);

  const tareaSeleccionada = seleccion.startsWith("tarea:")
    ? (tareasDeLaMateria.find((t) => t.id === seleccion.slice(6)) ?? null)
    : null;
  const examenSeleccionado = seleccion.startsWith("examen:")
    ? (examenesDeLaMateria.find((e) => e.id === seleccion.slice(7)) ?? null)
    : null;
  const tituloAuto = tareaSeleccionada?.titulo ?? examenSeleccionado?.titulo ?? null;

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <form action={crearCalificacion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Materia
        <select
          required
          value={materiaId}
          onChange={(e) => {
            setMateriaId(e.target.value);
            setSeleccion("");
          }}
          className={inputClass}
        >
          <option value="">Selecciona una materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>
      <input type="hidden" name="materia_id" value={materiaId} />

      {materiaId && (
        <label className="flex flex-col gap-1.5 text-sm">
          Tema y tarea/examen
          <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)} className={inputClass}>
            <option value="">— Ninguna, es una evaluación aparte —</option>
            {grupos.map(([clave, grupo]) => (
              <optgroup key={clave} label={grupo.titulo}>
                {grupo.tareas.map((t) => (
                  <option key={`tarea:${t.id}`} value={`tarea:${t.id}`}>
                    📋 {t.titulo}
                  </option>
                ))}
                {grupo.examenes.map((ex) => (
                  <option key={`examen:${ex.id}`} value={`examen:${ex.id}`}>
                    ❓ {ex.titulo}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="text-muted text-xs">
            Solo aparecen tareas y exámenes ya creados en esta materia. Si eliges uno, el título se toma de ahí.
          </span>
        </label>
      )}
      <input type="hidden" name="tarea_id" value={tareaSeleccionada?.id ?? ""} />
      <input type="hidden" name="examen_id" value={examenSeleccionado?.id ?? ""} />

      <label className="flex flex-col gap-1.5 text-sm">
        Alumno
        <select
          name="alumno_id"
          required
          defaultValue={alumnoIdPreseleccionado ?? ""}
          className={inputClass}
        >
          <option value="">Selecciona un alumno</option>
          {alumnos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre_completo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Título
        <input
          name="titulo"
          value={tituloAuto ?? tituloManual}
          onChange={(e) => setTituloManual(e.target.value)}
          readOnly={tituloAuto !== null}
          placeholder="Ej. Examen parcial 1 (si no elegiste una tarea o examen)"
          className={`${inputClass} ${tituloAuto !== null ? "opacity-70" : ""}`}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          Calificación
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            name="calificacion"
            placeholder="0-100"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Fecha
          <input type="date" name="fecha" className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Comentario
        <textarea
          name="comentario"
          rows={3}
          placeholder="Retroalimentación para el alumno (opcional)"
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
      >
        Guardar calificación
      </button>
    </form>
  );
}
