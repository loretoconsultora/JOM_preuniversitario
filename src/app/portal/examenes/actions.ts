"use server";

import { revalidatePath } from "next/cache";
import { requireDocente, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropicClient } from "@/lib/anthropic";
import { parseCSV } from "@/lib/csv";
import { notificarDocentesEntrega } from "@/lib/notificar-docentes";
import { examenAunNoAbre, examenCerrado, leyendaVentanaExamen } from "@/lib/fecha-examen";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";
import type { Examen, ExamenPreguntaAlumno, PreguntaBorrador } from "@/types/database";

// Devuelve un mensaje de validación o null si las preguntas están bien.
function validarPreguntas(preguntas: PreguntaBorrador[]): string | null {
  if (preguntas.length === 0) {
    return "Agrega al menos una pregunta.";
  }
  for (const [i, p] of preguntas.entries()) {
    if (!p.enunciado.trim()) return `La pregunta ${i + 1} no tiene enunciado.`;
    if (p.tipo === "abierta") continue;
    const opciones = p.opciones.map((o) => o.trim()).filter(Boolean);
    if (opciones.length < 2) return `La pregunta ${i + 1} necesita al menos 2 opciones.`;
    if (p.respuesta_correcta < 0 || p.respuesta_correcta >= p.opciones.length) {
      return `La pregunta ${i + 1} no tiene marcada una respuesta correcta válida.`;
    }
  }
  return null;
}

export async function crearExamen(input: {
  titulo: string;
  materia_id: string;
  tema_id: string | null;
  origen: "manual" | "ia" | "plantilla";
  preguntas: PreguntaBorrador[];
  alumnoIds?: string[];
  fecha_apertura?: string | null;
  hora_apertura?: string | null;
  fecha_cierre?: string | null;
  hora_cierre?: string | null;
}): Promise<ActionResult<{ id: string }>> {
  const profile = await requireDocente();

  const titulo = input.titulo.trim();
  if (!titulo) return actionError("El título es obligatorio.");
  if (!input.materia_id) return actionError("Selecciona una materia.");
  if (input.fecha_apertura && input.fecha_cierre && input.fecha_cierre < input.fecha_apertura) {
    return actionError("La fecha de cierre no puede ser anterior a la de apertura.");
  }
  const errorPreguntas = validarPreguntas(input.preguntas);
  if (errorPreguntas) return actionError(errorPreguntas);

  try {
    const supabase = await createClient();
    const { data: examen, error } = await supabase
      .from("examenes")
      .insert({
        titulo,
        materia_id: input.materia_id,
        tema_id: input.tema_id || null,
        origen: input.origen,
        creado_por: profile.id,
        fecha_apertura: input.fecha_apertura || null,
        hora_apertura: input.fecha_apertura ? input.hora_apertura || null : null,
        fecha_cierre: input.fecha_cierre || null,
        hora_cierre: input.fecha_cierre ? input.hora_cierre || null : null,
      })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    const { error: preguntasError } = await supabase.from("examen_preguntas").insert(
      input.preguntas.map((p, i) => ({
        examen_id: examen.id,
        orden: i,
        tipo: p.tipo,
        enunciado: p.enunciado.trim(),
        opciones: p.tipo === "multiple" ? p.opciones.map((o) => o.trim()) : null,
        respuesta_correcta: p.tipo === "multiple" ? p.respuesta_correcta : null,
      }))
    );
    if (preguntasError) return actionError(preguntasError.message);

    if (input.alumnoIds && input.alumnoIds.length > 0) {
      const { error: destinatariosError } = await supabase
        .from("examen_alumnos")
        .insert(input.alumnoIds.map((alumno_id) => ({ examen_id: examen.id, alumno_id })));
      if (destinatariosError) return actionError(destinatariosError.message);
    }

    revalidatePath("/portal/examenes");
    return actionOk({ id: examen.id as string });
  } catch (e) {
    console.error("crearExamen:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarExamen(id: string): Promise<ActionResult> {
  await requireDocente();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("examenes").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath("/portal/examenes");
    return actionOk({});
  } catch (e) {
    console.error("eliminarExamen:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarFechasExamen(
  id: string,
  fechas: { fecha_apertura: string; hora_apertura: string; fecha_cierre: string; hora_cierre: string }
): Promise<ActionResult> {
  await requireDocente();
  if (fechas.fecha_apertura && fechas.fecha_cierre && fechas.fecha_cierre < fechas.fecha_apertura) {
    return actionError("La fecha de cierre no puede ser anterior a la de apertura.");
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("examenes")
      .update({
        fecha_apertura: fechas.fecha_apertura || null,
        hora_apertura: fechas.fecha_apertura ? fechas.hora_apertura || null : null,
        fecha_cierre: fechas.fecha_cierre || null,
        hora_cierre: fechas.fecha_cierre ? fechas.hora_cierre || null : null,
      })
      .eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath("/portal/examenes");
    return actionOk({});
  } catch (e) {
    console.error("actualizarFechasExamen:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function generarPreguntasConIA(input: {
  materiaNombre: string;
  tema: string;
  cantidad: number;
}): Promise<ActionResult<{ preguntas: PreguntaBorrador[] }>> {
  await requireDocente();

  const tema = input.tema.trim();
  if (!tema) return actionError("Describe el tema del examen.");
  const cantidad = Math.min(Math.max(Math.round(input.cantidad) || 5, 1), 20);

  try {
    const client = createAnthropicClient();
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Genera ${cantidad} preguntas de opción múltiple de nivel preparación preuniversitaria (bachillerato) sobre "${tema}", en la materia de ${input.materiaNombre}. Cada pregunta debe tener exactamente 4 opciones, solo una correcta, en español, claras y sin ambigüedad. Varía la dificultad. No repitas preguntas.`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              preguntas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    enunciado: { type: "string" },
                    opciones: {
                      type: "array",
                      items: { type: "string" },
                    },
                    respuesta_correcta: {
                      type: "integer",
                      description: "Índice (0-3) de la opción correcta dentro de 'opciones'.",
                    },
                  },
                  required: ["enunciado", "opciones", "respuesta_correcta"],
                  additionalProperties: false,
                },
              },
            },
            required: ["preguntas"],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return actionError("La IA no devolvió una respuesta válida.");
    }

    let parsed: { preguntas: PreguntaBorrador[] };
    try {
      parsed = JSON.parse(textBlock.text) as { preguntas: PreguntaBorrador[] };
    } catch {
      return actionError("La IA devolvió una respuesta que no se pudo interpretar. Intenta de nuevo.");
    }

    const preguntas = parsed.preguntas
      .filter((p) => Array.isArray(p.opciones) && p.opciones.length >= 2)
      .map((p) => ({
        tipo: "multiple" as const,
        enunciado: p.enunciado,
        opciones: p.opciones,
        respuesta_correcta:
          p.respuesta_correcta >= 0 && p.respuesta_correcta < p.opciones.length ? p.respuesta_correcta : 0,
      }));
    return actionOk({ preguntas });
  } catch (e) {
    console.error("generarPreguntasConIA:", e);
    return actionError(e instanceof Error ? e.message : "No se pudieron generar las preguntas.");
  }
}

export async function parsearCSVExamen(formData: FormData): Promise<ActionResult<{ preguntas: PreguntaBorrador[] }>> {
  await requireDocente();

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Selecciona un archivo CSV.");
  }

  try {
    const text = await file.text();
    const rows = parseCSV(text);
    if (rows.length < 2) {
      return actionError("El CSV está vacío o solo tiene encabezado.");
    }

    const [, ...dataRows] = rows; // se ignora la fila de encabezado
    const letraAIndice: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

    const preguntas: PreguntaBorrador[] = [];
    for (const [i, row] of dataRows.entries()) {
      const [enunciado, opcionA, opcionB, opcionC, opcionD, respuesta] = row.map((c) => c.trim());
      if (!enunciado || !opcionA || !opcionB || !opcionC || !opcionD) {
        return actionError(`Fila ${i + 2} del CSV: faltan columnas (enunciado u opciones).`);
      }
      const indice = letraAIndice[(respuesta || "").toLowerCase()];
      if (indice === undefined) {
        return actionError(`Fila ${i + 2} del CSV: "respuesta_correcta" debe ser A, B, C o D.`);
      }
      preguntas.push({
        tipo: "multiple",
        enunciado,
        opciones: [opcionA, opcionB, opcionC, opcionD],
        respuesta_correcta: indice,
      });
    }
    return actionOk({ preguntas });
  } catch (e) {
    console.error("parsearCSVExamen:", e);
    return actionError(e instanceof Error ? e.message : "No se pudo leer el CSV.");
  }
}

async function assertExamenAccesible(examenId: string, alumnoId: string) {
  const admin = createAdminClient();
  const { data: destinatarios, error } = await admin
    .from("examen_alumnos")
    .select("alumno_id")
    .eq("examen_id", examenId);
  if (error) throw new Error(error.message);
  if (destinatarios && destinatarios.length > 0 && !destinatarios.some((d) => d.alumno_id === alumnoId)) {
    throw new Error("Este examen no está asignado a tu cuenta.");
  }
}

// Llamada directamente desde un Server Component (no cruza el límite de
// Server Action que oculta mensajes en producción), así que puede seguir
// lanzando errores: el error.tsx de la ruta los muestra igual.
export async function obtenerPreguntasParaTomar(examenId: string) {
  const profile = await requireProfile();
  if (profile.role === "alumno") await assertExamenAccesible(examenId, profile.id);
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: intentoExistente } = await supabase
    .from("examen_intentos")
    .select("*")
    .eq("examen_id", examenId)
    .eq("alumno_id", profile.id)
    .maybeSingle();

  if (intentoExistente) {
    return { yaPresentado: true as const, disponible: true as const, intento: intentoExistente };
  }

  const { data: examen } = await admin
    .from("examenes")
    .select("fecha_apertura, hora_apertura, fecha_cierre, hora_cierre")
    .eq("id", examenId)
    .single();

  if (examen) {
    if (examenAunNoAbre(examen as Examen)) {
      return {
        yaPresentado: false as const,
        disponible: false as const,
        motivo: "aun_no_abre" as const,
        leyenda: leyendaVentanaExamen(examen as Examen),
      };
    }
    if (examenCerrado(examen as Examen)) {
      return {
        yaPresentado: false as const,
        disponible: false as const,
        motivo: "cerrado" as const,
        leyenda: null,
      };
    }
  }

  const { data: preguntas, error } = await admin
    .from("examen_preguntas")
    .select("id, tipo, enunciado, opciones")
    .eq("examen_id", examenId)
    .order("orden");

  if (error) throw new Error(error.message);

  return {
    yaPresentado: false as const,
    disponible: true as const,
    preguntas: (preguntas ?? []) as ExamenPreguntaAlumno[],
  };
}

export async function entregarExamen(
  examenId: string,
  respuestas: Record<string, number | string>
): Promise<ActionResult<{ aciertos: number; total: number; calificacion: number | null }>> {
  const profile = await requireProfile();
  if (profile.role !== "alumno") {
    return actionError("Solo los alumnos pueden presentar exámenes.");
  }

  try {
    await assertExamenAccesible(examenId, profile.id);

    const admin = createAdminClient();
    const { data: examenFechas } = await admin
      .from("examenes")
      .select("fecha_apertura, hora_apertura, fecha_cierre, hora_cierre")
      .eq("id", examenId)
      .single();
    if (examenFechas) {
      if (examenAunNoAbre(examenFechas as Examen)) {
        return actionError("Este examen todavía no está disponible.");
      }
      if (examenCerrado(examenFechas as Examen)) {
        return actionError("Este examen ya cerró y ya no admite entregas.");
      }
    }

    const { data: preguntas, error } = await admin
      .from("examen_preguntas")
      .select("id, tipo, respuesta_correcta")
      .eq("examen_id", examenId);
    if (error) return actionError(error.message);
    if (!preguntas || preguntas.length === 0) return actionError("Este examen no tiene preguntas.");

    // Solo se autocalifican las preguntas de opción múltiple; las abiertas
    // quedan guardadas para revisión manual del docente, sin puntaje.
    const preguntasMultiple = preguntas.filter((p) => p.tipo === "multiple");
    let aciertos = 0;
    for (const pregunta of preguntasMultiple) {
      if (respuestas[pregunta.id] === pregunta.respuesta_correcta) aciertos += 1;
    }
    const total = preguntasMultiple.length;
    const calificacion = total > 0 ? Math.round((aciertos / total) * 1000) / 10 : null;

    const { error: insertError } = await admin.from("examen_intentos").insert({
      examen_id: examenId,
      alumno_id: profile.id,
      respuestas,
      aciertos,
      total,
      calificacion,
    });
    if (insertError) {
      if (insertError.code === "23505") {
        return actionError("Ya presentaste este examen.");
      }
      return actionError(insertError.message);
    }

    const { data: examen } = await admin.from("examenes").select("materia_id, titulo").eq("id", examenId).single();
    if (examen) {
      // El examen se autocalifica: si tiene preguntas de opción múltiple, la
      // calificación queda también en Calificaciones sin captura manual.
      if (calificacion !== null) {
        await admin.from("calificaciones").insert({
          alumno_id: profile.id,
          materia_id: examen.materia_id,
          titulo: examen.titulo,
          calificacion,
          comentario: "Autocalificado (examen)",
          fecha: new Date().toISOString().slice(0, 10),
          examen_id: examenId,
          creado_por: profile.id,
        });
      }
      await notificarDocentesEntrega({
        materiaId: examen.materia_id,
        alumnoNombre: profile.nombre_completo,
        tipo: "examen",
        titulo: examen.titulo,
        examenId,
      });
    }

    revalidatePath("/portal/examenes");
    revalidatePath(`/portal/examenes/${examenId}`);
    revalidatePath("/portal/calificaciones");
    return actionOk({ aciertos, total, calificacion });
  } catch (e) {
    console.error("entregarExamen:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
