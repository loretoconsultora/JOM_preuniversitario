"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { crearAgendamiento } from "@/app/portal/pacientes/actions";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function NuevoAgendamientoForm({ pacienteId }: { pacienteId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [recurrente, setRecurrente] = useState(true);
  const [diaSemana, setDiaSemana] = useState(1);
  const [hora, setHora] = useState("16:00");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState("");
  const [sesiones, setSesiones] = useState([{ fecha: "", hora: "16:00" }]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  function actualizarSesion(index: number, campo: "fecha" | "hora", valor: string) {
    setSesiones((prev) => prev.map((s, i) => (i === index ? { ...s, [campo]: valor } : s)));
  }

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      if (recurrente) {
        await crearAgendamiento(pacienteId, { recurrente: true, diaSemana, hora, fechaInicio, fechaFin: fechaFin || null });
      } else {
        await crearAgendamiento(pacienteId, { recurrente: false, sesiones });
      }
      setOpen(false);
      setSesiones([{ fecha: "", hora: "16:00" }]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el agendamiento.");
    } finally {
      setGuardando(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
      >
        <Plus size={15} /> Nuevo agendamiento
      </button>
    );
  }

  return (
    <div className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Nuevo agendamiento</p>
        <label className="flex items-center gap-2 text-xs">
          <span className={recurrente ? "text-muted" : "font-medium"}>Personalizado</span>
          <button
            type="button"
            role="switch"
            aria-checked={recurrente}
            onClick={() => setRecurrente((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${recurrente ? "bg-jom-ink dark:bg-jom-white" : "bg-black/15 dark:bg-white/20"}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-jom-white transition-transform dark:bg-jom-ink ${
                recurrente ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
          <span className={recurrente ? "font-medium" : "text-muted"}>Recurrente</span>
        </label>
      </div>

      {recurrente ? (
        <div className="flex flex-col gap-3">
          <p className="text-muted text-xs">Se agenda el mismo día y hora cada semana.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs">
              Día de la semana
              <select value={diaSemana} onChange={(e) => setDiaSemana(Number(e.target.value))} className={inputClass}>
                {DIAS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              Hora
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              Fecha de inicio
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs">
              Fecha final (opcional)
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className={inputClass} />
            </label>
          </div>
          <p className="text-muted text-xs">Si no defines fecha final, se agendan las próximas 12 semanas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-muted text-xs">Agrega cada sesión con su propia fecha y hora.</p>
          {sesiones.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={s.fecha}
                onChange={(e) => actualizarSesion(i, "fecha", e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <input
                type="time"
                value={s.hora}
                onChange={(e) => actualizarSesion(i, "hora", e.target.value)}
                className={`${inputClass} w-32`}
              />
              <button
                type="button"
                onClick={() => setSesiones((prev) => prev.filter((_, j) => j !== i))}
                aria-label="Quitar sesión"
                className="text-muted shrink-0 rounded-full p-1.5 hover:text-jom-ink"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setSesiones((prev) => [...prev, { fecha: "", hora: "16:00" }])}
            className="text-muted w-fit text-xs underline underline-offset-2 hover:text-fg"
          >
            + Agregar sesión
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="rounded-full bg-jom-ink px-5 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : "Guardar agendamiento"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted rounded-full px-4 py-2.5 text-sm hover:opacity-80"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
