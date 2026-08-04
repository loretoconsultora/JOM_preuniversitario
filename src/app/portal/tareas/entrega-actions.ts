"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAREAS_ENTREGAS_BUCKET } from "@/lib/storage";
import type { TareaPreguntaAlumno } from "@/types/database";

async function requireAlumno() {
  const profile = await requireProfile();
  if (profile.role !== "alumno") throw new Error("Solo los alumnos pueden entregar tareas.");
  return profile;
}

async function obtenerOCrearEntrega(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tareaId: string,
  alumnoId: string
) {
  const { data, error } = await supabase
    .from("tarea_entregas")
    .upsert(
      { tarea_id: tareaId, alumno_id: alumnoId, updated_at: new Date().toISOString() },
      { onConflict: "tarea_id,alumno_id" }
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function registrarArchivoEntrega(
  tareaId: string,
  archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number }
) {
  const profile = await requireAlumno();
  const supabase = await createClient();
  const entregaId = await obtenerOCrearEntrega(supabase, tareaId, profile.id);

  const { error } = await supabase.from("tarea_entrega_archivos").insert({ entrega_id: entregaId, ...archivo });
  if (error) throw new Error(error.message);

  revalidatePath("/portal/tareas");
}

export async function eliminarArchivoEntrega(archivoId: string) {
  await requireAlumno();
  const supabase = await createClient();

  const { data: archivo } = await supabase
    .from("tarea_entrega_archivos")
    .select("storage_path")
    .eq("id", archivoId)
    .single();

  if (archivo?.storage_path) {
    await supabase.storage.from(TAREAS_ENTREGAS_BUCKET).remove([archivo.storage_path]);
  }

  const { error } = await supabase.from("tarea_entrega_archivos").delete().eq("id", archivoId);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/tareas");
}

export async function guardarRespuestaTextoEntrega(tareaId: string, texto: string) {
  const profile = await requireAlumno();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tarea_entregas")
    .upsert(
      { tarea_id: tareaId, alumno_id: profile.id, respuesta_texto: texto, updated_at: new Date().toISOString() },
      { onConflict: "tarea_id,alumno_id" }
    );
  if (error) throw new Error(error.message);

  revalidatePath("/portal/tareas");
}

export async function obtenerPreguntasTarea(tareaId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const admin = createAdminClient();

  const { data: intentoExistente } = await supabase
    .from("tarea_intentos")
    .select("*")
    .eq("tarea_id", tareaId)
    .eq("alumno_id", profile.id)
    .maybeSingle();

  if (intentoExistente) {
    return { yaPresentado: true as const, intento: intentoExistente };
  }

  const { data: preguntas, error } = await admin
    .from("tarea_preguntas")
    .select("id, tipo, enunciado, opciones")
    .eq("tarea_id", tareaId)
    .order("orden");

  if (error) throw new Error(error.message);

  return {
    yaPresentado: false as const,
    preguntas: (preguntas ?? []) as TareaPreguntaAlumno[],
  };
}

export async function entregarPreguntasTarea(tareaId: string, respuestas: Record<string, number | string>) {
  const profile = await requireAlumno();
  const admin = createAdminClient();

  const { data: preguntas, error } = await admin
    .from("tarea_preguntas")
    .select("id, tipo, respuesta_correcta")
    .eq("tarea_id", tareaId);

  if (error) throw new Error(error.message);
  if (!preguntas || preguntas.length === 0) throw new Error("Esta tarea no tiene preguntas.");

  const preguntasMultiple = preguntas.filter((p) => p.tipo === "multiple");
  let aciertos = 0;
  for (const pregunta of preguntasMultiple) {
    if (respuestas[pregunta.id] === pregunta.respuesta_correcta) aciertos += 1;
  }
  const total = preguntasMultiple.length;
  const calificacion = total > 0 ? Math.round((aciertos / total) * 1000) / 10 : null;

  const { error: insertError } = await admin.from("tarea_intentos").insert({
    tarea_id: tareaId,
    alumno_id: profile.id,
    respuestas,
    aciertos,
    total,
    calificacion,
  });
  if (insertError) {
    if (insertError.code === "23505") throw new Error("Ya presentaste este cuestionario.");
    throw new Error(insertError.message);
  }

  revalidatePath("/portal/tareas");
  return { aciertos, total, calificacion };
}
