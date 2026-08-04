"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPacienteSalud } from "@/app/portal/pacientes/actions";
import { ASISTENCIA_SALUD_LABEL, ASISTENCIA_SALUD_OPCIONES } from "@/lib/paciente-salud";
import type { AsistenciaSaludTipo, PacienteSalud } from "@/types/database";

export function PacienteSaludForm({ pacienteId, salud }: { pacienteId: string; salud: PacienteSalud | null }) {
  const router = useRouter();
  const [medicacionToma, setMedicacionToma] = useState(salud?.medicacion_toma ?? false);
  const [medicacionCual, setMedicacionCual] = useState(salud?.medicacion_cual ?? "");
  const [medicacionDosis, setMedicacionDosis] = useState(salud?.medicacion_dosis ?? "");
  const [medicacionDesde, setMedicacionDesde] = useState(salud?.medicacion_desde ?? "");
  const [asistenciaTipos, setAsistenciaTipos] = useState<AsistenciaSaludTipo[]>(salud?.asistencia_tipos ?? []);
  const [asistenciaDetalle, setAsistenciaDetalle] = useState(salud?.asistencia_detalle ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  function toggleTipo(tipo: AsistenciaSaludTipo) {
    setAsistenciaTipos((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
    setGuardado(false);
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      await guardarPacienteSalud(pacienteId, {
        medicacion_toma: medicacionToma,
        medicacion_cual: medicacionCual.trim() || null,
        medicacion_dosis: medicacionDosis.trim() || null,
        medicacion_desde: medicacionDesde || null,
        asistencia_tipos: asistenciaTipos,
        asistencia_detalle: asistenciaDetalle.trim() || null,
      });
      setGuardado(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  const inputClass =
    "glass rounded-xl px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={medicacionToma}
            onChange={(e) => {
              setMedicacionToma(e.target.checked);
              setGuardado(false);
            }}
            className="h-4 w-4 rounded accent-jom-ink"
          />
          ¿Toma algún medicamento?
        </label>
        {medicacionToma && (
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={medicacionCual}
              onChange={(e) => {
                setMedicacionCual(e.target.value);
                setGuardado(false);
              }}
              placeholder="¿Cuál?"
              className={inputClass}
            />
            <input
              value={medicacionDosis}
              onChange={(e) => {
                setMedicacionDosis(e.target.value);
                setGuardado(false);
              }}
              placeholder="Dosis"
              className={inputClass}
            />
            <input
              type="date"
              value={medicacionDesde}
              onChange={(e) => {
                setMedicacionDesde(e.target.value);
                setGuardado(false);
              }}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="text-sm font-medium">Otro tipo de asistencia de salud</p>
        <div className="flex flex-wrap gap-1.5">
          {ASISTENCIA_SALUD_OPCIONES.map((tipo) => (
            <button
              key={tipo}
              type="button"
              onClick={() => toggleTipo(tipo)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                asistenciaTipos.includes(tipo)
                  ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink"
                  : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
              }`}
            >
              {ASISTENCIA_SALUD_LABEL[tipo]}
            </button>
          ))}
        </div>
        <input
          value={asistenciaDetalle}
          onChange={(e) => {
            setAsistenciaDetalle(e.target.value);
            setGuardado(false);
          }}
          placeholder="Especificar (opcional)"
          className={inputClass}
        />
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        type="button"
        onClick={guardar}
        disabled={guardando}
        className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardando ? "Guardando…" : guardado ? "Guardado ✓" : "Guardar"}
      </button>
    </div>
  );
}
