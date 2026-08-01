"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MOTIVOS_PRECARGADOS, colorMotivo } from "@/lib/motivo-tags";

export function MotivosPicker({ name }: { name: string }) {
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [otro, setOtro] = useState("");

  function toggle(m: string) {
    setSeleccionados((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function agregarOtro() {
    const valor = otro.trim();
    if (!valor) return;
    if (!seleccionados.includes(valor)) setSeleccionados((prev) => [...prev, valor]);
    setOtro("");
  }

  const personalizados = seleccionados.filter((m) => !MOTIVOS_PRECARGADOS.includes(m));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {MOTIVOS_PRECARGADOS.map((m) => {
          const activo = seleccionados.includes(m);
          const { background, border } = colorMotivo(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              style={activo ? { background, borderColor: border, color: "var(--color-jom-ink)" } : undefined}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                activo ? "" : "text-muted border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              }`}
            >
              {m}
            </button>
          );
        })}
        {personalizados.map((m) => {
          const { background, border } = colorMotivo(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => toggle(m)}
              style={{ background, borderColor: border, color: "var(--color-jom-ink)" }}
              className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              {m} <X size={11} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={otro}
          onChange={(e) => setOtro(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregarOtro();
            }
          }}
          placeholder="Otro (escribe y presiona Enter)"
          className="glass flex-1 rounded-xl px-3.5 py-2 text-xs placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink"
        />
        <button
          type="button"
          onClick={agregarOtro}
          aria-label="Agregar etiqueta personalizada"
          className="text-muted shrink-0 rounded-full bg-black/5 p-2 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
        >
          <Plus size={14} />
        </button>
      </div>

      {seleccionados.map((m) => (
        <input key={m} type="hidden" name={name} value={m} />
      ))}
    </div>
  );
}
