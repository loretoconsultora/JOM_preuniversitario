"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { crearSesionAsistencia } from "@/app/portal/asistencia-academica/actions";
import type { Profile } from "@/types/database";

export function TomarAsistenciaForm({ materiaId, alumnos }: { materiaId: string; alumnos: Profile[] }) {
  const router = useRouter();
  const hoy = new Date().toISOString().slice(0, 10);
  const [fecha, setFecha] = useState(hoy);
  const [nota, setNota] = useState("");
  const [presentes, setPresentes] = useState<Set<string>>(new Set());
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  function toggle(id: string) {
    setPresentes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setGuardado(false);
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const asistencias = alumnos.map((a) => ({ alumno_id: a.id, presente: presentes.has(a.id) }));
      await crearSesionAsistencia(materiaId, fecha, nota, asistencias);
      setPresentes(new Set());
      setNota("");
      setGuardado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la asistencia.");
    } finally {
      setGuardando(false);
    }
  }

  const inputClass =
    "glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-5">
      <p className="text-sm font-semibold">Tomar asistencia</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          Fecha
          <input
            type="date"
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value);
              setGuardado(false);
            }}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          Nota (opcional)
          <input
            value={nota}
            onChange={(e) => {
              setNota(e.target.value);
              setGuardado(false);
            }}
            placeholder="Ej. Tema visto ese día"
            className={inputClass}
          />
        </label>
      </div>

      <div className="flex flex-col gap-1 rounded-xl bg-black/5 p-2 dark:bg-white/5">
        {alumnos.map((a) => (
          <label
            key={a.id}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <input
              type="checkbox"
              checked={presentes.has(a.id)}
              onChange={() => toggle(a.id)}
              className="h-4 w-4 rounded accent-jom-ink"
            />
            {a.nombre_completo}
          </label>
        ))}
      </div>
      <p className="text-muted text-xs">
        {presentes.size} de {alumnos.length} marcados como presentes.
      </p>

      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-fit rounded-full bg-jom-ink px-5 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : guardado ? "Guardado ✓" : "Guardar asistencia"}
      </button>
    </div>
  );
}
