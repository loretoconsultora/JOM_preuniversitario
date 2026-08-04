"use client";

import { useRouter } from "next/navigation";

// Menú desplegable genérico para filtrar una página por materia (navega a
// la misma ruta con ?materia=). Se usa en Asistencia, Tareas y Exámenes
// para que el docente/directora vean el historial organizado por materia.
export function MateriaSelector({
  materias,
  seleccionada,
  basePath,
}: {
  materias: { id: string; nombre: string }[];
  seleccionada: string;
  basePath: string;
}) {
  const router = useRouter();

  return (
    <label className="flex w-fit flex-col gap-1.5 text-sm">
      Materia
      <select
        value={seleccionada}
        onChange={(e) => router.push(`${basePath}?materia=${e.target.value}`)}
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
