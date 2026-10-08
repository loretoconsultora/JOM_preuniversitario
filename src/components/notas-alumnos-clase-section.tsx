"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { guardarNotaAlumnoClase } from "@/app/portal/asistencia-academica/actions";

type FilaAlumno = { id: string; nombre_completo: string; presente: boolean; nota: string };

function FilaNotaAlumno({ sesionId, alumno }: { sesionId: string; alumno: FilaAlumno }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(alumno.nota);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await guardarNotaAlumnoClase(sesionId, alumno.id, borrador);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setEditando(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 border-b border-black/5 py-2.5 last:border-0 dark:border-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              alumno.presente ? "bg-jom-yellow/40 text-jom-ink" : "bg-jom-pink/30 text-jom-ink"
            }`}
          >
            {alumno.presente ? "Presente" : "Ausente"}
          </span>
          <span className="text-sm font-medium">{alumno.nombre_completo}</span>
        </div>
        {!editando && (
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-muted inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:text-fg"
          >
            <Pencil size={12} /> {alumno.nota ? "Editar nota" : "Agregar nota"}
          </button>
        )}
      </div>

      {editando ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={borrador}
            onChange={(e) => setBorrador(e.target.value)}
            rows={2}
            placeholder="Ej. Llegó tarde, buena participación"
            className="glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setBorrador(alumno.nota);
              }}
              className="text-muted text-xs hover:text-fg"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        alumno.nota && <p className="text-muted text-sm">{alumno.nota}</p>
      )}
    </div>
  );
}

export function NotasAlumnosClaseSection({ sesionId, alumnos }: { sesionId: string; alumnos: FilaAlumno[] }) {
  return (
    <div className="flex flex-col px-5 pb-4">
      {alumnos.map((a) => (
        <FilaNotaAlumno key={a.id} sesionId={sesionId} alumno={a} />
      ))}
    </div>
  );
}
