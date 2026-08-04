"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, AlertCircle } from "lucide-react";
import { actualizarInscripcionMateria } from "@/app/portal/asistencia-academica/actions";

type AlumnoConCorreo = { id: string; nombre_completo: string; email: string | null };

export function InscribirAlumnosSection({
  materiaId,
  alumnos,
  inscritosIniciales,
}: {
  materiaId: string;
  alumnos: AlumnoConCorreo[];
  inscritosIniciales: string[];
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>(inscritosIniciales);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await actualizarInscripcionMateria(materiaId, seleccion);
      setAbierto(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {inscritosIniciales.length === 0
            ? "Todos los alumnos pueden ver esta materia (sin restricción)"
            : `${inscritosIniciales.length} alumno(s) inscrito(s)`}
        </p>
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="text-muted inline-flex items-center gap-1.5 rounded-full bg-black/5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <UserPlus size={14} /> {abierto ? "Cerrar" : "Agregar alumnos"}
        </button>
      </div>

      {abierto && (
        <div className="glass flex flex-col gap-1 rounded-xl p-2">
          {alumnos.length === 0 ? (
            <p className="text-muted p-2 text-xs">No hay alumnos registrados todavía.</p>
          ) : (
            alumnos.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              >
                <input
                  type="checkbox"
                  checked={seleccion.includes(a.id)}
                  onChange={() => toggle(a.id)}
                  className="h-4 w-4 rounded accent-jom-ink"
                />
                <span>{a.nombre_completo}</span>
                {a.email && <span className="text-muted text-xs">{a.email}</span>}
              </label>
            ))
          )}
          {error && (
            <p className="flex items-center gap-1 px-2 text-xs text-red-500">
              <AlertCircle size={12} /> {error}
            </p>
          )}
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="m-2 w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            {guardando ? "Guardando…" : "Guardar inscripción"}
          </button>
        </div>
      )}
    </div>
  );
}
