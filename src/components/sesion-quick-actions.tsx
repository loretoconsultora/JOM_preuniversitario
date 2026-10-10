"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { marcarAsistencia, guardarNotaSesion, reagendarSesion, eliminarSesion } from "@/app/portal/pacientes/actions";
import type { EstadoSesion, Homoclave } from "@/types/database";
import { ESTADO_LABEL, ESTADO_CLASS, HOMOCLAVE_LABEL, HOMOCLAVE_CLASS } from "@/lib/estado-sesion";
import { RichTextEditor } from "@/components/rich-text-editor";

export function SesionQuickActions({
  sesionId,
  estadoInicial,
  notaInicial,
  homoclaveInicial = null,
  accionable,
  permitirEliminar = false,
}: {
  sesionId: string;
  estadoInicial: EstadoSesion;
  notaInicial: string | null;
  homoclaveInicial?: Homoclave | null;
  accionable: boolean;
  permitirEliminar?: boolean;
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSesion>(estadoInicial);
  const [homoclave, setHomoclave] = useState<Homoclave | null>(homoclaveInicial);
  const [nota, setNota] = useState(notaInicial ?? "");
  const [notaBorrador, setNotaBorrador] = useState(notaInicial ?? "");
  const [mostrarNota, setMostrarNota] = useState(false);
  const [mostrarReagendar, setMostrarReagendar] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevaHora, setNuevaHora] = useState("16:00");
  const [motivoReagendo, setMotivoReagendo] = useState<"" | "CNA" | "CT">("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function marcar(nuevoEstado: "asistio" | "no_asistio") {
    setCargando(true);
    setError(null);
    try {
      const resultado = await marcarAsistencia(sesionId, nuevoEstado);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setEstado(nuevoEstado);
      setHomoclave(nuevoEstado === "asistio" ? "SR" : "CNA");
      if (nuevoEstado === "asistio") setMostrarNota(true);
      router.refresh();
    } catch {
      setError("No se pudo actualizar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarNota() {
    setCargando(true);
    setError(null);
    try {
      const resultado = await guardarNotaSesion(sesionId, notaBorrador);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setNota(notaBorrador);
      setMostrarNota(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar la nota. Revisa tu conexión e intenta de nuevo.");
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
      const resultado = await reagendarSesion(sesionId, nuevaFecha, nuevaHora, motivoReagendo || null);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setEstado("reagendada");
      setHomoclave(motivoReagendo || null);
      setMostrarReagendar(false);
      router.refresh();
    } catch {
      setError("No se pudo reagendar. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminar() {
    if (!window.confirm("¿Eliminar esta sesión? Esta acción no se puede deshacer.")) return;
    setCargando(true);
    setError(null);
    try {
      const resultado = await eliminarSesion(sesionId);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo eliminar la sesión. Revisa tu conexión e intenta de nuevo.");
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
        {homoclave && (
          <span
            title={HOMOCLAVE_LABEL[homoclave]}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${HOMOCLAVE_CLASS[homoclave]}`}
          >
            {homoclave}
          </span>
        )}

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

        {permitirEliminar && (
          <button
            type="button"
            onClick={eliminar}
            disabled={cargando}
            className="text-jom-pink inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            <Trash2 size={12} /> Eliminar
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
        <div className="flex flex-col gap-1.5">
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
          </div>
          <select
            value={motivoReagendo}
            onChange={(e) => setMotivoReagendo(e.target.value as "" | "CNA" | "CT")}
            className="glass w-fit rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-jom-pink"
          >
            <option value="">Reprogramación normal (con aviso, sin cargo)</option>
            <option value="CNA">Canceló tarde el paciente (CNA, se factura)</option>
            <option value="CT">Cancelé yo tarde (CT, no se factura, genera sesión compensatoria)</option>
          </select>
          <button
            type="button"
            onClick={confirmarReagendo}
            disabled={cargando}
            className="w-fit rounded-full bg-jom-ink px-3 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
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
