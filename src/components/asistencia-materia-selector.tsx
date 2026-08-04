"use client";

import { useRouter } from "next/navigation";

// Menú desplegable para elegir de qué materia es la clase, en vez de
// pestañas — igual de funcional (navega a la misma página con ?materia=),
// pero como select explícito.
export function AsistenciaMateriaSelector({
  materias,
  seleccionada,
}: {
  materias: { id: string; nombre: string }[];
  seleccionada: string;
}) {
  const router = useRouter();

  return (
    <label className="flex w-fit flex-col gap-1.5 text-sm">
      Materia
      <select
        value={seleccionada}
        onChange={(e) => router.push(`/portal/asistencia-academica?materia=${e.target.value}`)}
        className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
      >
        {materias.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
