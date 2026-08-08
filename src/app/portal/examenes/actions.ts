"use server";

import { revalidatePath } from "next/cache";
import { requireDocente, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAnthropicClient } from "@/lib/anthropic";
import { parseCSV } from "@/lib/csv";
import { notificarDocentesEntrega } from "@/lib/notificar-docentes";
import { examenAunNoAbre, examenCerrado, leyendaVentanaExamen } from "@/lib/fecha-examen";
import type { Examen, ExamenPreguntaAlumno, PreguntaBorrador } from "@/types/database";

function validarPreguntas(preguntas: PreguntaBorrador[]) {
  if (preguntas.length === 0) {
    throw new Error("Agrega al menos una pregunta.");
  }
  for (const [i, p] of preguntas.entries()) {
    if (!p.enunciado.trim()) throw new Error(`La pregunta ${i + 1} no tiene enunciado.`);
    if (p.tipo === "abierta") continue;
    const opciones = p.opciones.map((o) => o.trim()).filter(Boolean);
    if (opciones.length < 2) throw new Error(`La pregunta ${i + 1} necesita al menos 2 opciones.`);
    if (p.respuesta_correcta < 0 || p.respuesta_correcta >= p.opciones.length) {
      throw new Error(`La pregunta ${i + 1} no tiene marcada una respuesta correcta válida.`);
    }
  }
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
}) {
  const profile = await requireDocente();

  const titulo = input.titulo.trim();
  if (!titulo) throw new Error("El título es obligatorio.");
  if (!input.materia_id) throw new Error("Selecciona una materia.");
  if (input.fecha_apertura && input.fecha_cierre && input.fecha_cierre < input.fecha_apertura) {
    throw new Error("La fecha de cierre no puede ser anterior a la de apertura.");
  }
  validarPreguntas(input.preguntas);

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

  if (error) throw new Error(error.message);

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

  if (preguntasError) throw new Error(preguntasError.message);

  if (input.alumnoIds && input.alumnoIds.length > 0) {
    const { error: destinatariosError } = await supabase
      .from("examen_alumnos")
      .insert(input.alumnoIds.map((alumno_id) => ({ examen_id: examen.id, alumno_id })));
    if (destinatariosError) throw new Error(destinatariosError.message);
  }

  revalidatePath("/portal/examenes");
  return { id: examen.id as string };
}

export async function eliminarExamen(id: string) {
  await requireDocente();
  const supabase = await createClient();
  const { error } = await supabase.from("examenes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/examenes");
}

export async function actualizarFechasExamen(
  id: string,
  fechas: { fecha_apertura: string; hora_apertura: string; fecha_cierre: string; hora_cierre: string }
) {
  await requireDocente();
  if (fechas.fecha_apertura && fechas.fecha_cierre && fechas.fecha_cierre < fechas.fecha_apertura) {
    throw new Error("La fecha de cierre no puede ser anterior a la de apertura.");
  }
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
  if (error) throw new Error(error.message);
  revalidatePath("/portal/examenes");
}

export async function generarPreguntasConIA(input: {
  materiaNombre: string;
  tema: string;
  cantidad: number;
}): Promise<PreguntaBorrador[]> {
  await requireDocente();

  const tema = input.tema.trim();
  if (!tema) throw new Error("Describe el tema del examen.");
  const cantidad = Math.min(Math.max(Math.round(input.cantidad) || 5, 1), 20);

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
    throw new Error("La IA no devolvió una respuesta válida.");
  }

  const parsed = JSON.parse(textBlock.text) as { preguntas: PreguntaBorrador[] };
  return parsed.preguntas
    .filter((p) => Array.isArray(p.opciones) && p.opciones.length >= 2)
    .map((p) => ({
      tipo: "multiple" as const,
      enunciado: p.enunciado,
      opciones: p.opciones,
      respuesta_correcta:
        p.respuesta_correcta >= 0 && p.respuesta_correcta < p.opciones.length
          ? p.respuesta_correcta
          : 0,
    }));
}

export async function parsearCSVExamen(formData: FormData): Promise<PreguntaBorrador[]> {
  await requireDocente();

  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo CSV.");
  }

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length < 2) {
    throw new Error("El CSV está vacío o solo tiene encabezado.");
  }

  const [, ...dataRows] = rows; // se ignora la fila de encabezado
  const letraAIndice: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };

  return dataRows.map((row, i) => {
    const [enunciado, opcionA, opcionB, opcionC, opcionD, respuesta] = row.map((c) => c.trim());
    if (!enunciado || !opcionA || !opcionB || !opcionC || !opcionD) {
      throw new Error(`Fila ${i + 2} del CSV: faltan columnas (enunciado u opciones).`);
    }
    const indice = letraAIndice[(respuesta || "").toLowerCase()];
    if (indice === undefined) {
      throw new Error(`Fila ${i + 2} del CSV: "respuesta_correcta" debe ser A, B, C o D.`);
    }
    return {
      tipo: "multiple" as const,
      enunciado,
      opciones: [opcionA, opcionB, opcionC, opcionD],
      respuesta_correcta: indice,
    };
  });
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

export async function entregarExamen(examenId: string, respuestas: Record<string, number | string>) {
  const profile = await requireProfile();
  if (profile.role !== "alumno") {
    throw new Error("Solo los alumnos pueden presentar exámenes.");
  }
  await assertExamenAccesible(examenId, profile.id);

  const admin = createAdminClient();
  const { data: examenFechas } = await admin
    .from("examenes")
    .select("fecha_apertura, hora_apertura, fecha_cierre, hora_cierre")
    .eq("id", examenId)
    .single();
  if (examenFechas) {
    if (examenAunNoAbre(examenFechas as Examen)) {
      throw new Error("Este examen todavía no está disponible.");
    }
    if (examenCerrado(examenFechas as Examen)) {
      throw new Error("Este examen ya cerró y ya no admite entregas.");
    }
  }

  const { data: preguntas, error } = await admin
    .from("examen_preguntas")
    .select("id, tipo, respuesta_correcta")
    .eq("examen_id", examenId);

  if (error) throw new Error(error.message);
  if (!preguntas || preguntas.length === 0) throw new Error("Este examen no tiene preguntas.");

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
      throw new Error("Ya presentaste este examen.");
    }
    throw new Error(insertError.message);
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
  return { aciertos, total, calificacion };
}
