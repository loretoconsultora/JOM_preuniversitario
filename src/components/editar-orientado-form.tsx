"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { editarOrientado } from "@/app/portal/orientados/actions";
import type { Orientado, Profile } from "@/types/database";

export function EditarOrientadoForm({ orientado, alumnos }: { orientado: Orientado; alumnos: Profile[] }) {
  const router = useRouter();
  const [alumnoId, setAlumnoId] = useState(orientado.alumno_id ?? "");
  const [nombre, setNombre] = useState(orientado.nombre);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  function onAlumnoChange(id: string) {
    setAlumnoId(id);
    if (!id) return;
    const alumno = alumnos.find((a) => a.id === id);
    if (alumno) setNombre(alumno.nombre_completo);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await editarOrientado(orientado.id, new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push(`/portal/orientados/${orientado.id}`);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {alumnos.length > 0 && (
        <label className="flex flex-col gap-1.5 text-sm">
          Vincular a alumno existente (opcional)
          <select name="alumno_id" value={alumnoId} onChange={(e) => onAlumnoChange(e.target.value)} className={inputClass}>
            <option value="">No vincular</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre_completo}
              </option>
            ))}
          </select>
          <span className="text-muted text-xs">Si lo vinculas, el nombre del caso se toma del alumno.</span>
        </label>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        Nombre
        <input
          name="nombre"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          readOnly={!!alumnoId}
          placeholder="Nombre completo"
          className={`${inputClass} ${alumnoId ? "opacity-70" : ""}`}
        />
        {alumnoId && <span className="text-muted text-xs">Se toma del alumno vinculado.</span>}
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Objetivo vocacional (opcional)
        <textarea
          name="objetivo"
          rows={3}
          defaultValue={orientado.objetivo ?? ""}
          placeholder="Ej. Definir entre ingeniería y diseño, explorar universidades en el extranjero…"
          className={inputClass}
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}
