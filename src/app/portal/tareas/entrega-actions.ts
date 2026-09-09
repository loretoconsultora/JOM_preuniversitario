"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { TAREAS_ENTREGAS_BUCKET } from "@/lib/storage";
import { tareaCerrada } from "@/lib/fecha-limite-tarea";
import { notificarDocentesEntrega } from "@/lib/notificar-docentes";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";
import type { Profile, TareaIntento, TareaPreguntaAlumno } from "@/types/database";

// Errores de validación esperables dentro de este archivo (rol incorrecto,
// tarea cerrada): se modelan como excepciones internas y cada action
// exportada las atrapa para devolverlas como ActionResult, sin dejar que
// se escapen como throw hacia el cliente.
class ValidacionEntregaError extends Error {}

async function requireAlumno(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "alumno") throw new ValidacionEntregaError("Solo los alumnos pueden entregar tareas.");
  return profile;
}

async function requireTareaAbierta(supabase: Awaited<ReturnType<typeof createClient>>, tareaId: string) {
  const { data: tarea } = await supabase
    .from("tareas")
    .select("fecha_entrega, hora_limite")
    .eq("id", tareaId)
    .single();
  if (tarea && tareaCerrada(tarea)) {
    throw new ValidacionEntregaError("La fecha límite de esta tarea ya pasó. Ya no se pueden cargar entregas.");
  }
  return tarea;
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
    .select("id, notificado")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string, notificado: data.notificado as boolean };
}

// Avisa a los docentes de la materia solo la primera vez que hay algo que
// revisar para esta entrega (archivo o texto) — no en cada edición.
async function notificarSiEsPrimeraVez(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entregaId: string,
  yaNotificado: boolean,
  tareaId: string,
  alumnoNombre: string
) {
  if (yaNotificado) return;
  const { data: tarea } = await supabase.from("tareas").select("materia_id, titulo").eq("id", tareaId).single();
  if (!tarea) return;
  await supabase.from("tarea_entregas").update({ notificado: true }).eq("id", entregaId);
  await notificarDocentesEntrega({
    materiaId: tarea.materia_id,
    alumnoNombre,
    tipo: "tarea",
    titulo: tarea.titulo,
    tareaId,
  });
}

export async function registrarArchivoEntrega(
  tareaId: string,
  archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number }
): Promise<ActionResult> {
  try {
    const profile = await requireAlumno();
    const supabase = await createClient();
    await requireTareaAbierta(supabase, tareaId);
    const entrega = await obtenerOCrearEntrega(supabase, tareaId, profile.id);

    const { error } = await supabase.from("tarea_entrega_archivos").insert({ entrega_id: entrega.id, ...archivo });
    if (error) return actionError(error.message);

    await notificarSiEsPrimeraVez(supabase, entrega.id, entrega.notificado, tareaId, profile.nombre_completo);

    revalidatePath("/portal/tareas");
    revalidatePath("/portal/temario");
    return actionOk({});
  } catch (e) {
    if (e instanceof ValidacionEntregaError) return actionError(e.message);
    console.error("registrarArchivoEntrega:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarArchivoEntrega(archivoId: string): Promise<ActionResult> {
  try {
    await requireAlumno();
    const supabase = await createClient();

    const { data: archivo } = await supabase
      .from("tarea_entrega_archivos")
      .select("storage_path, entrega_id, tarea_entregas(tarea_id)")
      .eq("id", archivoId)
      .single();

    const tareaId = (archivo?.tarea_entregas as unknown as { tarea_id: string } | null)?.tarea_id;
    if (tareaId) await requireTareaAbierta(supabase, tareaId);

    if (archivo?.storage_path) {
      await supabase.storage.from(TAREAS_ENTREGAS_BUCKET).remove([archivo.storage_path]);
    }

    const { error } = await supabase.from("tarea_entrega_archivos").delete().eq("id", archivoId);
    if (error) return actionError(error.message);

    revalidatePath("/portal/tareas");
    revalidatePath("/portal/temario");
    return actionOk({});
  } catch (e) {
    if (e instanceof ValidacionEntregaError) return actionError(e.message);
    console.error("eliminarArchivoEntrega:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarRespuestaTextoEntrega(tareaId: string, texto: string): Promise<ActionResult> {
  try {
    const profile = await requireAlumno();
    const supabase = await createClient();
    await requireTareaAbierta(supabase, tareaId);

    const { data, error } = await supabase
      .from("tarea_entregas")
      .upsert(
        { tarea_id: tareaId, alumno_id: profile.id, respuesta_texto: texto, updated_at: new Date().toISOString() },
        { onConflict: "tarea_id,alumno_id" }
      )
      .select("id, notificado")
      .single();
    if (error) return actionError(error.message);

    if (texto.trim()) {
      await notificarSiEsPrimeraVez(supabase, data.id, data.notificado, tareaId, profile.nombre_completo);
    }

    revalidatePath("/portal/tareas");
    revalidatePath("/portal/temario");
    return actionOk({});
  } catch (e) {
    if (e instanceof ValidacionEntregaError) return actionError(e.message);
    console.error("guardarRespuestaTextoEntrega:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function obtenerPreguntasTarea(
  tareaId: string
): Promise<
  ActionResult<
    | { yaPresentado: true; intento: TareaIntento }
    | { yaPresentado: false; preguntas: TareaPreguntaAlumno[] }
  >
> {
  try {
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
      return actionOk({ yaPresentado: true as const, intento: intentoExistente });
    }

    const { data: preguntas, error } = await admin
      .from("tarea_preguntas")
      .select("id, tipo, enunciado, opciones")
      .eq("tarea_id", tareaId)
      .order("orden");
    if (error) return actionError(error.message);

    return actionOk({
      yaPresentado: false as const,
      preguntas: (preguntas ?? []) as TareaPreguntaAlumno[],
    });
  } catch (e) {
    console.error("obtenerPreguntasTarea:", e);
    return actionError(e instanceof Error ? e.message : "No se pudieron cargar las preguntas.");
  }
}

export async function entregarPreguntasTarea(
  tareaId: string,
  respuestas: Record<string, number | string>
): Promise<ActionResult<{ aciertos: number; total: number; calificacion: number | null }>> {
  try {
    const profile = await requireAlumno();
    const supabase = await createClient();
    await requireTareaAbierta(supabase, tareaId);
    const admin = createAdminClient();

    const { data: preguntas, error } = await admin
      .from("tarea_preguntas")
      .select("id, tipo, respuesta_correcta")
      .eq("tarea_id", tareaId);
    if (error) return actionError(error.message);
    if (!preguntas || preguntas.length === 0) return actionError("Esta tarea no tiene preguntas.");

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
      if (insertError.code === "23505") return actionError("Ya presentaste este cuestionario.");
      return actionError(insertError.message);
    }

    const { data: tarea } = await admin.from("tareas").select("materia_id, titulo").eq("id", tareaId).single();
    if (tarea) {
      // El cuestionario se autocalifica: si tiene preguntas de opción
      // múltiple, la calificación queda también en Calificaciones sin que
      // el docente tenga que capturarla a mano.
      if (calificacion !== null) {
        await admin.from("calificaciones").insert({
          alumno_id: profile.id,
          materia_id: tarea.materia_id,
          titulo: tarea.titulo,
          calificacion,
          comentario: "Autocalificado (cuestionario de tarea)",
          fecha: new Date().toISOString().slice(0, 10),
          tarea_id: tareaId,
          creado_por: profile.id,
        });
      }
      await notificarDocentesEntrega({
        materiaId: tarea.materia_id,
        alumnoNombre: profile.nombre_completo,
        tipo: "tarea",
        titulo: tarea.titulo,
        tareaId,
      });
    }

    revalidatePath("/portal/tareas");
    revalidatePath("/portal/temario");
    revalidatePath("/portal/calificaciones");
    return actionOk({ aciertos, total, calificacion });
  } catch (e) {
    if (e instanceof ValidacionEntregaError) return actionError(e.message);
    console.error("entregarPreguntasTarea:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
