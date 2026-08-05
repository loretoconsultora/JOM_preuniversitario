"use client";

import { useRouter } from "next/navigation";

// Menú desplegable genérico para filtrar una página por materia (navega a
// la misma ruta con ?materia=). Se usa en Asistencia, Tareas y Exámenes
// para que el docente/directora vean el historial organizado por materia.
export function MateriaSelector({
  materias,
  seleccionada,
  basePath,
  placeholder,
}: {
  materias: { id: string; nombre: string }[];
  seleccionada: string;
  basePath: string;
  // Si se da, aparece como primera opción con value="" (para pantallas
  // donde no hay una materia seleccionada por defecto). basePath puede
  // traer su propio query string (ej. "...?vista=materia"): se detecta y
  // se agrega con "&" en vez de "?".
  placeholder?: string;
}) {
  const router = useRouter();
  const separador = basePath.includes("?") ? "&" : "?";

  return (
    <label className="flex w-fit flex-col gap-1.5 text-sm">
      Materia
      <select
        value={seleccionada}
        onChange={(e) => router.push(`${basePath}${separador}materia=${e.target.value}`)}
        className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {materias.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
