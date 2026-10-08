"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check, Trash2, Undo2, Pencil } from "lucide-react";
import { guardarPlanOrientacion } from "@/app/portal/orientados/actions";
import type { OrientacionPlan, PasoOrientacion } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}

function TagInput({
  label,
  valores,
  disabled,
  onAgregar,
  onQuitar,
}: {
  label: string;
  valores: string[];
  disabled: boolean;
  onAgregar: (valor: string) => void;
  onQuitar: (index: number) => void;
}) {
  const [borrador, setBorrador] = useState("");
  const inputClass =
    "glass flex-1 rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink disabled:opacity-60";

  function confirmar() {
    const valor = borrador.trim();
    if (!valor) return;
    onAgregar(valor);
    setBorrador("");
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <span>{label}</span>
      <div className="flex gap-2">
        <input
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              confirmar();
            }
          }}
          disabled={disabled}
          placeholder="Escribe y presiona Enter"
          className={inputClass}
        />
        <button
          type="button"
          onClick={confirmar}
          disabled={disabled}
          className="rounded-xl bg-black/5 px-3.5 text-sm font-medium transition-colors hover:bg-black/10 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/15"
        >
          Agregar
        </button>
      </div>
      {valores.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {valores.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-jom-ink ${
                i % 2 === 0 ? "bg-jom-pink/40" : "bg-jom-yellow/50"
              }`}
            >
              {v}
              {!disabled && (
                <button type="button" onClick={() => onQuitar(i)} aria-label={`Quitar ${v}`} className="hover:opacity-60">
                  <X size={11} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function planVacio(plan: OrientacionPlan | null) {
  return (
    !plan ||
    (!plan.metas && plan.carreras_interes.length === 0 && plan.universidades_interes.length === 0 && plan.proximos_pasos.length === 0)
  );
}

export function PlanOrientacionForm({ orientadoId, plan }: { orientadoId: string; plan: OrientacionPlan | null }) {
  const router = useRouter();
  const [editando, setEditando] = useState(planVacio(plan));
  const [metas, setMetas] = useState(plan?.metas ?? "");
  const [carreras, setCarreras] = useState<string[]>(plan?.carreras_interes ?? []);
  const [universidades, setUniversidades] = useState<string[]>(plan?.universidades_interes ?? []);
  const [pasos, setPasos] = useState<PasoOrientacion[]>(plan?.proximos_pasos ?? []);
  const [pasoTexto, setPasoTexto] = useState("");
  const [pasoFecha, setPasoFecha] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "glass rounded-xl px-3.5 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink disabled:opacity-60";
  const bloqueado = !editando;

  function marcarCambio() {
    setGuardado(false);
  }

  function agregarPaso() {
    const texto = pasoTexto.trim();
    if (!texto) return;
    setPasos((prev) => [
      ...prev,
      { id: crypto.randomUUID(), texto, fecha: pasoFecha || null, completado: false },
    ]);
    setPasoTexto("");
    setPasoFecha("");
    marcarCambio();
  }

  function alternarCompletado(id: string) {
    setPasos((prev) => prev.map((p) => (p.id === id ? { ...p, completado: !p.completado } : p)));
    marcarCambio();
  }

  function eliminarPaso(id: string) {
    setPasos((prev) => prev.filter((p) => p.id !== id));
    marcarCambio();
  }

  const pendientes = pasos
    .filter((p) => !p.completado)
    .sort((a, b) => {
      if (a.fecha && b.fecha) return a.fecha.localeCompare(b.fecha);
      if (a.fecha) return -1;
      if (b.fecha) return 1;
      return 0;
    });
  const completados = pasos.filter((p) => p.completado);

  async function guardar() {
    setError(null);
    setGuardando(true);
    try {
      const resultado = await guardarPlanOrientacion(orientadoId, {
        metas,
        carreras_interes: carreras,
        universidades_interes: universidades,
        proximos_pasos: pasos,
      });
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setGuardado(true);
      setEditando(false);
      router.refresh();
    } catch {
      setError("No se pudo guardar el plan. Revisa tu conexión e intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Metas
        <textarea
          value={metas}
          onChange={(e) => {
            setMetas(e.target.value);
            marcarCambio();
          }}
          disabled={bloqueado}
          rows={2}
          placeholder="Qué busca lograr en este proceso"
          className={inputClass}
        />
      </label>

      <TagInput
        label="Carreras de interés"
        valores={carreras}
        disabled={bloqueado}
        onAgregar={(v) => {
          setCarreras((prev) => [...prev, v]);
          marcarCambio();
        }}
        onQuitar={(i) => {
          setCarreras((prev) => prev.filter((_, idx) => idx !== i));
          marcarCambio();
        }}
      />

      <TagInput
        label="Universidades de interés"
        valores={universidades}
        disabled={bloqueado}
        onAgregar={(v) => {
          setUniversidades((prev) => [...prev, v]);
          marcarCambio();
        }}
        onQuitar={(i) => {
          setUniversidades((prev) => prev.filter((_, idx) => idx !== i));
          marcarCambio();
        }}
      />

      <div className="flex flex-col gap-1.5 text-sm">
        <span>Próximos pasos</span>
        <div className="flex flex-wrap gap-2">
          <input
            value={pasoTexto}
            onChange={(e) => setPasoTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarPaso();
              }
            }}
            disabled={bloqueado}
            placeholder="Ej. Agendar visita a la universidad"
            className={`${inputClass} flex-1`}
          />
          <input
            type="date"
            value={pasoFecha}
            onChange={(e) => setPasoFecha(e.target.value)}
            disabled={bloqueado}
            className={`${inputClass} w-auto`}
          />
          <button
            type="button"
            onClick={agregarPaso}
            disabled={bloqueado}
            className="rounded-xl bg-black/5 px-3.5 text-sm font-medium transition-colors hover:bg-black/10 disabled:opacity-60 dark:bg-white/10 dark:hover:bg-white/15"
          >
            Agregar
          </button>
        </div>

        <div className={`mt-1 grid gap-3 ${completados.length > 0 ? "sm:grid-cols-2" : ""}`}>
          <div className="flex flex-col gap-2">
            {completados.length > 0 && <p className="text-muted text-xs font-medium uppercase">Próximos pasos</p>}
            {pendientes.length === 0 ? (
              <p className="text-muted text-xs">No hay pasos pendientes.</p>
            ) : (
              pendientes.map((p) => (
                <div key={p.id} className="glass flex items-center justify-between gap-2 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => alternarCompletado(p.id)}
                      disabled={bloqueado}
                      aria-label="Marcar como completado"
                      className="text-muted flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-black/15 hover:border-jom-pink hover:text-jom-pink disabled:opacity-60 dark:border-white/20"
                    >
                      <Check size={11} />
                    </button>
                    <div className="min-w-0">
                      <p className="truncate text-sm">{p.texto}</p>
                      {p.fecha && <p className="text-muted text-xs">{formatFecha(p.fecha)}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => eliminarPaso(p.id)}
                    disabled={bloqueado}
                    aria-label="Eliminar paso"
                    className="text-muted shrink-0 rounded-full p-1 hover:bg-jom-pink/20 hover:text-jom-ink disabled:opacity-60"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          {completados.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-muted text-xs font-medium uppercase">Pasos completados</p>
              {completados.map((p) => (
                <div key={p.id} className="glass flex items-center justify-between gap-2 rounded-xl px-3 py-2 opacity-70">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-jom-pink/40 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-jom-ink">
                      <Check size={11} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm line-through">{p.texto}</p>
                      {p.fecha && <p className="text-muted text-xs">{formatFecha(p.fecha)}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => alternarCompletado(p.id)}
                    disabled={bloqueado}
                    aria-label="Marcar como pendiente de nuevo"
                    className="text-muted shrink-0 rounded-full p-1 hover:bg-black/10 disabled:opacity-60 dark:hover:bg-white/10"
                  >
                    <Undo2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {bloqueado ? (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="inline-flex w-fit items-center gap-1.5 rounded-full bg-black/5 px-4 py-2 text-xs font-semibold transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <Pencil size={13} /> Actualizar
        </button>
      ) : (
        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="w-fit rounded-full bg-jom-ink px-4 py-2 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
        >
          {guardando ? "Guardando…" : guardado ? "Guardado ✓" : "Guardar plan"}
        </button>
      )}
    </div>
  );
}
