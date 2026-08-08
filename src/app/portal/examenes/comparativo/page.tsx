import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { alumnosInscritos } from "@/lib/materias-inscritas";
import { compararExamenes } from "@/lib/comparativo-examenes";
import { ComparativoSelector } from "@/components/comparativo-selector";
import type { Examen, Materia } from "@/types/database";

export default async function ComparativoExamenesPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string; inicial?: string; final?: string }>;
}) {
  const profile = await requireStaff();
  const { materia: materiaParam, inicial: inicialParam, final: finalParam } = await searchParams;
  const supabase = await createClient();

  const materiasList =
    profile.role === "docente"
      ? await materiasGestionables(supabase, profile.id)
      : (((await supabase.from("materias").select("*").order("nombre")).data ?? []) as Materia[]);
  const materiaIds = new Set(materiasList.map((m) => m.id));
  const materiaSel = materiaParam && materiaIds.has(materiaParam) ? materiaParam : "";

  const { data: examenesData } = materiaSel
    ? await supabase.from("examenes").select("*").eq("materia_id", materiaSel).order("created_at")
    : { data: [] as Examen[] };
  const examenesList = (examenesData ?? []) as Examen[];
  const examenIds = new Set(examenesList.map((e) => e.id));
  const inicialSel = inicialParam && examenIds.has(inicialParam) ? inicialParam : "";
  const finalSel = finalParam && examenIds.has(finalParam) ? finalParam : "";

  let contenido = (
    <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
      Elige una materia y los dos exámenes que quieres comparar (por ejemplo, una autoevaluación inicial y su
      versión final).
    </div>
  );

  if (materiaSel && inicialSel && finalSel) {
    if (inicialSel === finalSel) {
      contenido = (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Elige dos exámenes distintos para comparar.
        </div>
      );
    } else {
      const alumnos = await alumnosInscritos(supabase, materiaSel);
      if (alumnos.length === 0) {
        contenido = (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            No hay alumnos inscritos en esta materia todavía.
          </div>
        );
      } else {
        const comparativo = await compararExamenes(supabase, inicialSel, finalSel, alumnos);
        if (comparativo.variables.length === 0) {
          contenido = (
            <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
              Estos dos exámenes no tienen ninguna pregunta en común para comparar. Para que se emparejen, sus
              preguntas deben empezar igual antes de un guion largo (ej. &quot;Pensamiento analítico — ...&quot;).
            </div>
          );
        } else {
          contenido = (
            <div className="flex flex-col gap-4">
              {(comparativo.variablesSinPareja.inicial.length > 0 ||
                comparativo.variablesSinPareja.final.length > 0) && (
                <div className="glass rounded-2xl p-4 text-xs text-muted">
                  Sin pareja en el otro examen (no se están comparando):{" "}
                  {[...comparativo.variablesSinPareja.inicial, ...comparativo.variablesSinPareja.final].join(", ")}
                </div>
              )}
              <div className="glass overflow-hidden rounded-2xl">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                      <th className="px-5 py-3 font-medium">Alumno</th>
                      <th className="px-5 py-3 font-medium">Variable</th>
                      <th className="px-5 py-3 font-medium">Inicial</th>
                      <th className="px-5 py-3 font-medium">Final</th>
                      <th className="px-5 py-3 font-medium">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparativo.filas.map((fila, i) => {
                      const diferencia =
                        fila.inicial !== null && fila.final !== null ? fila.final - fila.inicial : null;
                      return (
                        <tr
                          key={`${fila.alumnoId}-${fila.variable}`}
                          className="border-b border-black/5 last:border-0 dark:border-white/5"
                        >
                          {(i === 0 || comparativo.filas[i - 1].alumnoId !== fila.alumnoId) && (
                            <td
                              className="px-5 py-3 font-medium align-top"
                              rowSpan={comparativo.filas.filter((f) => f.alumnoId === fila.alumnoId).length}
                            >
                              {fila.alumnoNombre}
                            </td>
                          )}
                          <td className="px-5 py-3">{fila.variable}</td>
                          <td className="px-5 py-3" title={fila.inicialTexto ?? ""}>
                            {fila.inicial ?? (fila.inicialTexto ? "revisar texto" : "—")}
                          </td>
                          <td className="px-5 py-3" title={fila.finalTexto ?? ""}>
                            {fila.final ?? (fila.finalTexto ? "revisar texto" : "—")}
                          </td>
                          <td
                            className={`px-5 py-3 font-semibold ${
                              diferencia === null
                                ? "text-muted"
                                : diferencia > 0
                                  ? "text-green-600"
                                  : diferencia < 0
                                    ? "text-red-500"
                                    : "text-muted"
                            }`}
                          >
                            {diferencia === null ? "—" : diferencia > 0 ? `+${diferencia}` : diferencia}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-muted text-xs">
                El número se toma de los primeros caracteres de la respuesta de cada alumno. Si dice &quot;revisar
                texto&quot;, pasa el mouse sobre la celda para ver la respuesta completa — no se encontró un número
                claro al inicio.
              </p>
            </div>
          );
        }
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/portal/examenes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
          <ArrowLeft size={14} /> Volver a exámenes
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Comparativo de exámenes</h1>
        <p className="text-muted text-sm">
          Contrasta las respuestas de dos exámenes (ej. autoevaluación inicial vs. final) pregunta por pregunta.
        </p>
      </div>

      <ComparativoSelector
        materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
        examenes={examenesList.map((e) => ({ id: e.id, titulo: e.titulo, materia_id: e.materia_id }))}
        materiaSel={materiaSel}
        inicialSel={inicialSel}
        finalSel={finalSel}
      />

      {contenido}
    </div>
  );
}
