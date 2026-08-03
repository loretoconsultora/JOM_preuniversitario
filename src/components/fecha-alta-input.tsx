"use client";

import { useState } from "react";

export function FechaAltaInput({ name, className }: { name: string; className: string }) {
  const mesActual = new Date().toISOString().slice(0, 7);
  const [valor, setValor] = useState(mesActual);

  return (
    <div className="flex items-center gap-2">
      <input
        type="month"
        name={name}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className={`${className} flex-1`}
      />
      <button
        type="button"
        onClick={() => setValor(mesActual)}
        className="text-muted shrink-0 rounded-full bg-black/5 px-3.5 py-2.5 text-xs font-medium transition-colors hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/15"
      >
        Nuevo paciente
      </button>
    </div>
  );
}
