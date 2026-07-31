import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Examen, ExamenIntento, ExamenPregunta, Materia, Profile } from "@/types/database";
import { obtenerPreguntasParaTomar } from "../actions";
import { TomarExamenForm } from "@/components/tomar-examen-form";

export default async function ExamenDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const { data: examen } = await supabase.from("examenes").select("*").eq("id", id).single();
  if (!examen) notFound();
  const examenData = examen as Examen;

  const { data: materia } = await supabase
    .from("materias")
    .select("*")
    .eq("id", examenData.materia_id)
    .single();

  if (isStaff) {
    const [{ data: preguntas }, { data: intentos }, { data: alumnos }] = await Promise.all([
      supabase.from("examen_preguntas").select("*").eq("examen_id", id).order("orden"),
      supabase.from("examen_intentos").select("*").eq("examen_id", id).order("calificacion", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    ]);
    const preguntasList = (preguntas ?? []) as ExamenPregunta[];
    const intentosList = (intentos ?? []) as ExamenIntento[];
    const alumnoById = new Map(((alumnos ?? []) as Profile[]).map((a) => [a.id, a]));

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/portal/examenes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
          <ArrowLeft size={14} /> Volver a exámenes
        </Link>

        <div>
          <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
            {(materia as Materia | null)?.nombre ?? "Materia"}
          </span>
          <h1 className="mt-2 text-2xl font-semibold">{examenData.titulo}</h1>
          <p className="text-muted text-sm">{preguntasList.length} preguntas</p>
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Resultados</h2>
          {intentosList.length === 0 ? (
            <div className="glass rounded-2xl p-6 text-center text-sm text-muted">
              Nadie ha presentado este examen todavía.
            </div>
          ) : (
            <div className="glass overflow-hidden rounded-2xl">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                    <th className="px-5 py-3 font-medium">Alumno</th>
                    <th className="px-5 py-3 font-medium">Aciertos</th>
                    <th className="px-5 py-3 font-medium">Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {intentosList.map((intento) => (
                    <tr key={intento.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                      <td className="px-5 py-3 font-medium">
                        {alumnoById.get(intento.alumno_id)?.nombre_completo ?? "—"}
                      </td>
                      <td className="px-5 py-3">
                        {intento.aciertos}/{intento.total}
                      </td>
                      <td className="px-5 py-3 font-semibold">{intento.calificacion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Preguntas</h2>
          <div className="flex flex-col gap-3">
            {preguntasList.map((pregunta, i) => (
              <div key={pregunta.id} className="glass rounded-2xl p-4">
                <p className="text-sm font-medium">
                  {i + 1}. {pregunta.enunciado}
                </p>
                <ul className="mt-2 flex flex-col gap-1">
                  {pregunta.opciones.map((opcion, oIndex) => (
                    <li
                      key={oIndex}
                      className={`text-sm ${
                        oIndex === pregunta.respuesta_correcta
                          ? "font-semibold text-jom-ink dark:text-jom-yellow"
                          : "text-fg/70"
                      }`}
                    >
                      {oIndex === pregunta.respuesta_correcta ? "✓ " : "· "}
                      {opcion}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Alumno
  const resultado = await obtenerPreguntasParaTomar(id);

  if (resultado.yaPresentado) {
    const intento = resultado.intento as ExamenIntento;
    const admin = createAdminClient();
    const { data: preguntas } = await admin
      .from("examen_preguntas")
      .select("id, enunciado, opciones, respuesta_correcta")
      .eq("examen_id", id)
      .order("orden");

    const revision = (preguntas ?? []).map((p) => ({
      id: p.id as string,
      enunciado: p.enunciado as string,
      opciones: p.opciones as string[],
      tuRespuesta: intento.respuestas[p.id] as number | undefined,
      esCorrecta: intento.respuestas[p.id] === p.respuesta_correcta,
    }));

    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <Link href="/portal/examenes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
          <ArrowLeft size={14} /> Volver a exámenes
        </Link>

        <div className="glass-strong rounded-2xl p-6 text-center">
          <p className="text-muted text-sm">Tu calificación</p>
          <p className="mt-1 text-4xl font-bold">{intento.calificacion}%</p>
          <p className="text-muted mt-1 text-sm">
            {intento.aciertos} de {intento.total} correctas
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {revision.map((p, i) => (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="flex items-start gap-2">
                {p.esCorrecta ? (
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-green-600" />
                ) : (
                  <XCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {i + 1}. {p.enunciado}
                  </p>
                  <p className="text-muted mt-1 text-xs">
                    Tu respuesta: {p.tuRespuesta !== undefined ? p.opciones[p.tuRespuesta] : "Sin responder"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Link href="/portal/examenes" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a exámenes
      </Link>

      <div>
        <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
          {(materia as Materia | null)?.nombre ?? "Materia"}
        </span>
        <h1 className="mt-2 text-2xl font-semibold">{examenData.titulo}</h1>
      </div>

      <TomarExamenForm examenId={id} preguntas={resultado.preguntas} />
    </div>
  );
}
