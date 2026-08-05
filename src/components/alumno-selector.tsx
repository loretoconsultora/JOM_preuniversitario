"use client";

import { useRouter } from "next/navigation";

// Menú desplegable para elegir un alumno, navegando a basePath con
// ?alumno= agregado (basePath ya debe traer sus propios query params,
// ej. "/portal/calificaciones?vista=alumno").
export function AlumnoSelector({
  alumnos,
  seleccionado,
  basePath,
}: {
  alumnos: { id: string; nombre: string }[];
  seleccionado: string;
  basePath: string;
}) {
  const router = useRouter();
  const separador = basePath.includes("?") ? "&" : "?";

  return (
    <label className="flex w-fit flex-col gap-1.5 text-sm">
      Alumno
      <select
        value={seleccionado}
        onChange={(e) => router.push(`${basePath}${separador}alumno=${e.target.value}`)}
        className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
      >
        <option value="">Selecciona un alumno</option>
        {alumnos.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}
