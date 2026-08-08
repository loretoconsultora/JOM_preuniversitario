import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ExamenPregunta, ExamenIntento, Profile } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Las preguntas de estas autoevaluaciones se redactan como
// "Variable — pregunta" (ej. "Pensamiento analítico — Del 1 al 10..."),
// para poder emparejar la misma variable entre dos exámenes aunque la
// pregunta esté redactada distinto (evita el sesgo de "recordar mi
// respuesta anterior"). Si una pregunta no trae ese separador, se usa el
// enunciado completo como variable — solo empareja si es idéntico en
// ambos exámenes.
function extraerVariable(enunciado: string): string {
  const separador = enunciado.indexOf(" — ");
  return separador === -1 ? enunciado.trim() : enunciado.slice(0, separador).trim();
}

// Busca un número del 1 al 10 al inicio de la respuesta (donde se le pidió
// al alumno que lo pusiera). Si no aparece ahí, no se adivina — se marca
// para revisión manual en vez de arriesgar un número equivocado tomado de
// otra parte del texto (ej. si el alumno repite "del 1 al 10" en su
// respuesta).
export function extraerNumero(valor: number | string | undefined): number | null {
  if (valor === undefined) return null;
  if (typeof valor === "number") return valor >= 1 && valor <= 10 ? valor : null;
  const inicio = valor.trim().slice(0, 20);
  const match = inicio.match(/\b(10|[1-9])\b/);
  return match ? Number(match[1]) : null;
}

export type FilaComparativo = {
  alumnoId: string;
  alumnoNombre: string;
  variable: string;
  inicial: number | null;
  inicialTexto: string | null;
  final: number | null;
  finalTexto: string | null;
};

export type Comparativo = {
  variables: string[];
  filas: FilaComparativo[];
  variablesSinPareja: { inicial: string[]; final: string[] };
};

export async function compararExamenes(
  supabase: Supabase,
  examenInicialId: string,
  examenFinalId: string,
  alumnos: Profile[]
): Promise<Comparativo> {
  const [{ data: preguntasInicial }, { data: preguntasFinal }, { data: intentosInicial }, { data: intentosFinal }] =
    await Promise.all([
      supabase.from("examen_preguntas").select("*").eq("examen_id", examenInicialId).order("orden"),
      supabase.from("examen_preguntas").select("*").eq("examen_id", examenFinalId).order("orden"),
      supabase.from("examen_intentos").select("*").eq("examen_id", examenInicialId),
      supabase.from("examen_intentos").select("*").eq("examen_id", examenFinalId),
    ]);

  const preguntasInicialList = (preguntasInicial ?? []) as ExamenPregunta[];
  const preguntasFinalList = (preguntasFinal ?? []) as ExamenPregunta[];

  const variablePorPreguntaInicial = new Map(preguntasInicialList.map((p) => [p.id, extraerVariable(p.enunciado)]));
  const variablePorPreguntaFinal = new Map(preguntasFinalList.map((p) => [p.id, extraerVariable(p.enunciado)]));

  const preguntaInicialPorVariable = new Map(
    preguntasInicialList.map((p) => [extraerVariable(p.enunciado), p.id])
  );
  const preguntaFinalPorVariable = new Map(preguntasFinalList.map((p) => [extraerVariable(p.enunciado), p.id]));

  const variablesInicial = new Set(variablePorPreguntaInicial.values());
  const variablesFinal = new Set(variablePorPreguntaFinal.values());
  const variables = [...variablesInicial].filter((v) => variablesFinal.has(v));
  // Conserva el orden original del examen inicial para las que sí
  // emparejan; el resto queda listado como "sin pareja" para que la
  // docente sepa que esas preguntas no se están comparando.
  const variablesOrdenadas = preguntasInicialList
    .map((p) => extraerVariable(p.enunciado))
    .filter((v, i, arr) => variables.includes(v) && arr.indexOf(v) === i);

  const intentoInicialPorAlumno = new Map(((intentosInicial ?? []) as ExamenIntento[]).map((i) => [i.alumno_id, i]));
  const intentoFinalPorAlumno = new Map(((intentosFinal ?? []) as ExamenIntento[]).map((i) => [i.alumno_id, i]));

  const filas: FilaComparativo[] = [];
  for (const alumno of alumnos) {
    const intentoInicial = intentoInicialPorAlumno.get(alumno.id);
    const intentoFinal = intentoFinalPorAlumno.get(alumno.id);
    for (const variable of variablesOrdenadas) {
      const preguntaInicialId = preguntaInicialPorVariable.get(variable);
      const preguntaFinalId = preguntaFinalPorVariable.get(variable);
      const textoInicial = preguntaInicialId ? intentoInicial?.respuestas[preguntaInicialId] : undefined;
      const textoFinal = preguntaFinalId ? intentoFinal?.respuestas[preguntaFinalId] : undefined;
      filas.push({
        alumnoId: alumno.id,
        alumnoNombre: alumno.nombre_completo,
        variable,
        inicial: extraerNumero(textoInicial),
        inicialTexto: typeof textoInicial === "string" ? textoInicial : null,
        final: extraerNumero(textoFinal),
        finalTexto: typeof textoFinal === "string" ? textoFinal : null,
      });
    }
  }

  return {
    variables: variablesOrdenadas,
    filas,
    variablesSinPareja: {
      inicial: [...variablesInicial].filter((v) => !variablesFinal.has(v)),
      final: [...variablesFinal].filter((v) => !variablesInicial.has(v)),
    },
  };
}
