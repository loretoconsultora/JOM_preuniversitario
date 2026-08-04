"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil } from "lucide-react";
import { marcarAsistencia, guardarNotaSesion, reagendarSesion } from "@/app/portal/pacientes/actions";
import type { EstadoSesion } from "@/types/database";
import { ESTADO_LABEL, ESTADO_CLASS } from "@/lib/estado-sesion";
import { RichTextEditor } from "@/components/rich-text-editor";

export function SesionQuickActions({
  sesionId,
  estadoInicial,
  notaInicial,
  accionable,
}: {
  sesionId: string;
  estadoInicial: EstadoSesion;
  notaInicial: string | null;
  accionable: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSesion>(estadoInicial);
  const [nota, setNota] = useState(notaInicial ?? "");
  const [notaBorrador, setNotaBorrador] = useState(notaInicial ?? "");
  const [mostrarNota, setMostrarNota] = useState(false);
  const [mostrarReagendar, setMostrarReagendar] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("16:00");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar(nuevoEstado: "asistio" | "no_asistio") {
    setCargando(true);
    setError(null);
    try {
      await marcarAsistencia(sesionId, nuevoEstado);
      setEstado(nuevoEstado);
      if (nuevoEstado === "asistio") setMostrarNota(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarNota() {
    setCargando(true);
    setError(null);
    try {
      await guardarNotaSesion(sesionId, notaBorrador);
      setNota(notaBorrador);
      setMostrarNota(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la nota.");
    } finally {
      setCargando(false);
    }
  }

  async function confirmarReagendo() {
    if (!nuevaFecha) {
      setError("Indica la nueva fecha.");
      return;
    }
    setCargando(true);
    setError(null);
    try {
      await reagendarSesion(sesionId, nuevaFecha, nuevaHora);
      setEstado("reagendada");
      setMostrarReagendar(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reagendar.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CLASS[estado]}`}>
          {ESTADO_LABEL[estado]}
        </span>

        {accionable && estado === "pendiente" && (
          <>
            <button
              type="button"
              onClick={() => marcar("asistio")}
              disabled={cargando}
              className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-green-500/20 dark:text-green-400"
            >
              ✅ Asistió
            </button>
            <button
              type="button"
              onClick={() => marcar("no_asistio")}
              disabled={cargando}
              className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-red-500/20 dark:text-red-400"
            >
              ❌ No asistió
            </button>
          </>
        )}

        {estado !== "reagendada" && (
          <button
            type="button"
            onClick={() => setMostrarReagendar((v) => !v)}
            disabled={cargando}
            className="inline-flex items-center gap-1 rounded-full bg-black/5 px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50 dark:bg-white/10"
          >
            <CalendarClock size={12} /> Reagendar
          </button>
        )}

        {estado === "asistio" && !mostrarNota && (
          <button
            type="button"
            onClick={() => setMostrarNota(true)}
            className="text-muted inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:text-fg"
          >
            <Pencil size={12} /> {nota ? "Editar nota" : "Agregar nota"}
          </button>
        )}
      </div>

      {mostrarNota && (
        <div className="flex flex-col gap-1.5">
          <RichTextEditor
            name="nota_sesion"
            defaultValue={nota}
            placeholder="Nota de la sesión (privada)"
            minHeightClass="min-h-[4rem]"
            onChange={setNotaBorrador}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={guardarNota}
              disabled={cargando}
              className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
            >
              Guardar nota
            </button>
            <button
              type="button"
              onClick={() => setMostrarNota(false)}
              className="text-muted text-xs hover:text-fg"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {mostrarReagendar && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={nuevaFecha}
            onChange={(e) => setNuevaFecha(e.target.value)}
            className="glass rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <input
            type="time"
            value={nuevaHora}
            onChange={(e) => setNuevaHora(e.target.value)}
            className="glass w-28 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
          />
          <button
            type="button"
            onClick={confirmarReagendo}
            disabled={cargando}
            className="rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
          >
            Confirmar
          </button>
        </div>
      )}

      {!mostrarNota && estado === "asistio" && nota && (
        <div className="rich-content text-muted text-xs" dangerouslySetInnerHTML={{ __html: nota }} />
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
