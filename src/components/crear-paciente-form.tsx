"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MotivosPicker } from "@/components/motivos-picker";
import { FechaAltaInput } from "@/components/fecha-alta-input";
import { crearPaciente } from "@/app/portal/pacientes/actions";
import type { Profile } from "@/types/database";

export function CrearPacienteForm({ alumnos }: { alumnos: Profile[] }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const resultado = await crearPaciente(new FormData(e.currentTarget));
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push(`/portal/pacientes/${resultado.id}`);
    } catch {
      setError("No se pudo crear el paciente. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Nombre
        <input name="nombre" required placeholder="Nombre completo" className={inputClass} />
      </label>

      {alumnos.length > 0 && (
        <label className="flex flex-col gap-1.5 text-sm">
          Vincular a alumno existente (opcional)
          <select name="alumno_id" className={inputClass}>
            <option value="">No vincular</option>
            {alumnos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre_completo}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex flex-col gap-1.5 text-sm">
        Motivos de referencia
        <MotivosPicker name="motivos" />
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        ¿Desde cuándo es paciente?
        <FechaAltaInput name="fecha_alta" className={inputClass} />
        <span className="text-muted text-xs">
          El botón &quot;Nuevo paciente&quot; deja el mes actual (se marcará como &quot;Nuevo paciente&quot; en el
          listado). También puedes elegir un mes anterior para pacientes que ya llevaban terapia antes de usar esta
          plataforma. A partir de aquí se cuenta el ciclo de evaluaciones mensuales.
        </span>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={guardando}
        className="mt-2 rounded-full bg-jom-ink px-6 py-3 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Creando…" : "Crear paciente"}
      </button>
    </form>
  );
}
