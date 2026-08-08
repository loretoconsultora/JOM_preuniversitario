"use client";

import { useRouter } from "next/navigation";

// Selector de materia + los dos exámenes a comparar (inicial/final), para
// /portal/examenes/comparativo. Cambiar de materia resetea los exámenes
// elegidos, ya que pertenecen a otra materia.
export function ComparativoSelector({
  materias,
  examenes,
  materiaSel,
  inicialSel,
  finalSel,
}: {
  materias: { id: string; nombre: string }[];
  examenes: { id: string; titulo: string; materia_id: string }[];
  materiaSel: string;
  inicialSel: string;
  finalSel: string;
}) {
  const router = useRouter();
  const examenesMateria = examenes.filter((e) => e.materia_id === materiaSel);

  function ir(params: { materia: string; inicial?: string; final?: string }) {
    const qs = new URLSearchParams();
    qs.set("materia", params.materia);
    if (params.inicial) qs.set("inicial", params.inicial);
    if (params.final) qs.set("final", params.final);
    router.push(`/portal/examenes/comparativo?${qs.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex w-fit flex-col gap-1.5 text-sm">
        Materia
        <select
          value={materiaSel}
          onChange={(e) => ir({ materia: e.target.value })}
          className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
        >
          <option value="">Selecciona una materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>

      {materiaSel && (
        <>
          <label className="flex w-fit flex-col gap-1.5 text-sm">
            Examen inicial
            <select
              value={inicialSel}
              onChange={(e) => ir({ materia: materiaSel, inicial: e.target.value, final: finalSel })}
              className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
            >
              <option value="">Selecciona un examen</option>
              {examenesMateria.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.titulo}
                </option>
              ))}
            </select>
          </label>

          <label className="flex w-fit flex-col gap-1.5 text-sm">
            Examen final
            <select
              value={finalSel}
              onChange={(e) => ir({ materia: materiaSel, inicial: inicialSel, final: e.target.value })}
              className="glass rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-jom-pink"
            >
              <option value="">Selecciona un examen</option>
              {examenesMateria.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.titulo}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}
