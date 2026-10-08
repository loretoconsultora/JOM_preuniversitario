"use server";

import { revalidatePath } from "next/cache";
import { requireCoachVocacional, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ORIENTACION_RECURSOS_BUCKET, ORIENTACION_TESTS_BUCKET } from "@/lib/storage";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";
import type { PasoOrientacion } from "@/types/database";

export async function crearOrientado(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requireCoachVocacional();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre es obligatorio.");
  const objetivo = String(formData.get("objetivo") || "").trim();
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("orientados")
      .insert({ coach_id: profile.id, alumno_id, nombre, objetivo: objetivo || null })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    revalidatePath("/portal/orientados");
    return actionOk({ id: data.id as string });
  } catch (e) {
    console.error("crearOrientado:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function editarOrientado(id: string, formData: FormData): Promise<ActionResult> {
  await requireCoachVocacional();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre es obligatorio.");
  const objetivo = String(formData.get("objetivo") || "").trim();
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("orientados")
      .update({ alumno_id, nombre, objetivo: objetivo || null })
      .eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/orientados");
    revalidatePath(`/portal/orientados/${id}`);
    return actionOk({});
  } catch (e) {
    console.error("editarOrientado:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function archivarOrientado(id: string, activo: boolean): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientados").update({ activo }).eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/orientados/${id}`);
    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("archivarOrientado:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

// Solo se puede eliminar un caso ya archivado, como salvaguarda extra
// contra borrados accidentales (igual criterio que eliminarPaciente).
export async function eliminarOrientado(id: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { data: orientado, error: eSel } = await supabase
      .from("orientados")
      .select("activo")
      .eq("id", id)
      .single();
    if (eSel || !orientado) return actionError("No encontrado.");
    if (orientado.activo) return actionError("Solo se pueden eliminar casos archivados.");

    const { error } = await supabase.from("orientados").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("eliminarOrientado:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

type AgendamientoInput =
  | { recurrente: true; diaSemana: number; hora: string; fechaInicio: string; fechaFin: string | null }
  | { recurrente: false; sesiones: { fecha: string; hora: string }[] };

export async function crearAgendamientoOrientacion(orientadoId: string, input: AgendamientoInput): Promise<ActionResult> {
  const profile = await requireCoachVocacional();

  let filas: { fecha: string; hora: string | null }[] = [];

  if (input.recurrente) {
    if (!input.hora) return actionError("Indica la hora de la sesión.");
    if (!input.fechaInicio) return actionError("Indica la fecha de inicio.");
    const cursor = new Date(`${input.fechaInicio}T00:00:00`);
    if (Number.isNaN(cursor.getTime())) return actionError("Fecha de inicio inválida.");
    while (cursor.getDay() !== input.diaSemana) cursor.setDate(cursor.getDate() + 1);

    const limite = input.fechaFin
      ? new Date(`${input.fechaFin}T00:00:00`)
      : new Date(cursor.getTime() + 1000 * 60 * 60 * 24 * 7 * 11);

    let guard = 0;
    while (cursor.getTime() <= limite.getTime() && guard < 52) {
      filas.push({ fecha: cursor.toISOString().slice(0, 10), hora: input.hora });
      cursor.setDate(cursor.getDate() + 7);
      guard++;
    }
  } else {
    filas = input.sesiones.filter((s) => s.fecha).map((s) => ({ fecha: s.fecha, hora: s.hora || null }));
  }

  if (filas.length === 0) return actionError("Agrega al menos una sesión.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_sesiones").insert(
      filas.map((f) => ({
        orientado_id: orientadoId,
        fecha: f.fecha,
        hora: f.hora,
        creado_por: profile.id,
      }))
    );
    if (error) return actionError(error.message);

    revalidatePath(`/portal/orientados/${orientadoId}`);
    return actionOk({});
  } catch (e) {
    console.error("crearAgendamientoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarAsistenciaOrientacion(sesionId: string, estado: "asistio" | "no_asistio"): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_sesiones").update({ estado }).eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("marcarAsistenciaOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarSesionOrientacion(sesionId: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_sesiones").delete().eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("eliminarSesionOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarNotaSesionOrientacion(sesionId: string, nota: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_sesiones").update({ nota: nota || null }).eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("guardarNotaSesionOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function reagendarSesionOrientacion(sesionId: string, nuevaFecha: string, nuevaHora: string): Promise<ActionResult> {
  await requireCoachVocacional();
  if (!nuevaFecha) return actionError("Indica la nueva fecha.");

  try {
    const supabase = await createClient();
    const { data: sesion, error: eSel } = await supabase
      .from("orientacion_sesiones")
      .select("orientado_id, creado_por")
      .eq("id", sesionId)
      .single();
    if (eSel || !sesion) return actionError("Sesión no encontrada.");

    const { data: nueva, error: eIns } = await supabase
      .from("orientacion_sesiones")
      .insert({
        orientado_id: sesion.orientado_id,
        fecha: nuevaFecha,
        hora: nuevaHora || null,
        creado_por: sesion.creado_por,
      })
      .select("id")
      .single();
    if (eIns) return actionError(eIns.message);

    const { error: eUpd } = await supabase
      .from("orientacion_sesiones")
      .update({ estado: "reagendada", reagendada_a_id: nueva.id })
      .eq("id", sesionId);
    if (eUpd) return actionError(eUpd.message);

    revalidatePath("/portal/orientados");
    return actionOk({});
  } catch (e) {
    console.error("reagendarSesionOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarPlanOrientacion(
  orientadoId: string,
  datos: {
    metas: string;
    carreras_interes: string[];
    universidades_interes: string[];
    proximos_pasos: PasoOrientacion[];
  }
): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_plan").upsert({
      orientado_id: orientadoId,
      metas: datos.metas.trim() || null,
      carreras_interes: datos.carreras_interes,
      universidades_interes: datos.universidades_interes,
      proximos_pasos: datos.proximos_pasos,
      actualizado_por: profile.id,
      updated_at: new Date().toISOString(),
    });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/orientados/${orientadoId}`);
    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("guardarPlanOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function agregarNotaOrientacion(orientadoId: string, contenido: string): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  if (!contenido.trim()) return actionError("Escribe una nota.");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("orientacion_notas")
      .insert({ orientado_id: orientadoId, contenido, creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/orientados/${orientadoId}`);
    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("agregarNotaOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarNotaOrientacion(id: string, orientadoId: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_notas").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/orientados/${orientadoId}`);
    return actionOk({});
  } catch (e) {
    console.error("eliminarNotaOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function registrarTestOrientacion(
  orientadoId: string,
  datos: {
    nombre_test: string;
    resultado: string;
    instrucciones: string;
    fecha: string;
    modo: "archivo" | "link" | "interactivo";
    url: string | null;
    archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number } | null;
    preguntas: { enunciado: string; opciones: string[] }[];
  }
): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  const nombre_test = datos.nombre_test.trim();
  if (!nombre_test) return actionError("Indica el nombre del test.");
  if (datos.modo === "archivo" && !datos.archivo) return actionError("Selecciona un archivo.");
  if (datos.modo === "link" && !datos.url?.trim()) return actionError("Pega el link del test.");

  const preguntasValidas =
    datos.modo === "interactivo"
      ? datos.preguntas
          .map((p) => ({ enunciado: p.enunciado.trim(), opciones: p.opciones.map((o) => o.trim()).filter(Boolean) }))
          .filter((p) => p.enunciado && p.opciones.length >= 2)
      : [];
  if (datos.modo === "interactivo" && preguntasValidas.length === 0) {
    return actionError("Agrega al menos una pregunta con dos opciones.");
  }

  try {
    const supabase = await createClient();
    let urlNormalizada = datos.url?.trim() || null;
    if (urlNormalizada && !/^https?:\/\//i.test(urlNormalizada)) urlNormalizada = `https://${urlNormalizada}`;

    const { data: test, error } = await supabase
      .from("orientacion_tests")
      .insert({
        orientado_id: orientadoId,
        nombre_test,
        modo: datos.modo,
        resultado: datos.modo === "interactivo" ? null : datos.resultado.trim() || null,
        instrucciones: datos.modo === "interactivo" ? datos.instrucciones.trim() || null : null,
        fecha: datos.fecha || new Date().toISOString().slice(0, 10),
        url: datos.modo === "link" ? urlNormalizada : null,
        storage_path: datos.modo === "archivo" ? datos.archivo!.storage_path : null,
        nombre_archivo: datos.modo === "archivo" ? datos.archivo!.nombre_archivo : null,
        tipo_mime: datos.modo === "archivo" ? datos.archivo!.tipo_mime : null,
        tamano_bytes: datos.modo === "archivo" ? datos.archivo!.tamano_bytes : null,
        creado_por: profile.id,
      })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    if (datos.modo === "interactivo") {
      const { error: preguntasError } = await supabase.from("orientacion_test_preguntas").insert(
        preguntasValidas.map((p, i) => ({
          test_id: test.id as string,
          orden: i,
          enunciado: p.enunciado,
          opciones: p.opciones,
        }))
      );
      if (preguntasError) return actionError(preguntasError.message);
    }

    revalidatePath(`/portal/orientados/${orientadoId}`);
    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("registrarTestOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function responderTestOrientacion(testId: string, respuestas: number[]): Promise<ActionResult> {
  const profile = await requireProfile();
  if (profile.role !== "alumno") return actionError("Solo el alumno puede responder este test.");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("orientacion_test_respuesta")
      .insert({ test_id: testId, alumno_id: profile.id, respuestas });
    if (error) {
      if (error.code === "23505") return actionError("Ya respondiste este test.");
      return actionError(error.message);
    }

    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("responderTestOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function evaluarTestOrientacion(
  testId: string,
  orientadoId: string,
  resultado: string
): Promise<ActionResult> {
  await requireCoachVocacional();
  const texto = resultado.trim();
  if (!texto) return actionError("Escribe la interpretación del resultado.");

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("orientacion_tests").update({ resultado: texto }).eq("id", testId);
    if (error) return actionError(error.message);

    revalidatePath(`/portal/orientados/${orientadoId}`);
    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("evaluarTestOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarTestOrientacion(id: string, orientadoId: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { data: test } = await supabase.from("orientacion_tests").select("storage_path").eq("id", id).single();
    if (test?.storage_path) {
      await supabase.storage.from(ORIENTACION_TESTS_BUCKET).remove([test.storage_path]);
    }
    const { error } = await supabase.from("orientacion_tests").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/orientados/${orientadoId}`);
    return actionOk({});
  } catch (e) {
    console.error("eliminarTestOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

// orientadoId null = recurso general de la biblioteca de la coach, visible
// a todos sus orientados; con orientadoId, queda adjunto a ese caso.
export async function registrarRecursoOrientacion(datos: {
  orientado_id: string | null;
  titulo: string;
  tipo: "archivo" | "enlace";
  url: string | null;
  archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number } | null;
}): Promise<ActionResult> {
  const profile = await requireCoachVocacional();
  const titulo = datos.titulo.trim();
  if (!titulo) return actionError("El título es obligatorio.");
  if (datos.tipo === "enlace" && !datos.url?.trim()) return actionError("Pega el link del recurso.");
  if (datos.tipo === "archivo" && !datos.archivo) return actionError("Selecciona un archivo.");

  try {
    const supabase = await createClient();
    let urlNormalizada = datos.url?.trim() || null;
    if (urlNormalizada && !/^https?:\/\//i.test(urlNormalizada)) urlNormalizada = `https://${urlNormalizada}`;

    const { error } = await supabase.from("orientacion_recursos").insert({
      coach_id: profile.id,
      orientado_id: datos.orientado_id,
      titulo,
      tipo: datos.tipo,
      url: datos.tipo === "enlace" ? urlNormalizada : null,
      storage_path: datos.tipo === "archivo" ? datos.archivo!.storage_path : null,
      nombre_archivo: datos.tipo === "archivo" ? datos.archivo!.nombre_archivo : null,
      tipo_mime: datos.tipo === "archivo" ? datos.archivo!.tipo_mime : null,
      tamano_bytes: datos.tipo === "archivo" ? datos.archivo!.tamano_bytes : null,
      creado_por: profile.id,
    });
    if (error) return actionError(error.message);

    revalidatePath("/portal/orientados");
    if (datos.orientado_id) revalidatePath(`/portal/orientados/${datos.orientado_id}`);
    revalidatePath("/portal/mi-orientacion");
    return actionOk({});
  } catch (e) {
    console.error("registrarRecursoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarRecursoOrientacion(id: string): Promise<ActionResult> {
  await requireCoachVocacional();
  try {
    const supabase = await createClient();
    const { data: recurso } = await supabase
      .from("orientacion_recursos")
      .select("storage_path, orientado_id")
      .eq("id", id)
      .single();
    if (recurso?.storage_path) {
      await supabase.storage.from(ORIENTACION_RECURSOS_BUCKET).remove([recurso.storage_path]);
    }
    const { error } = await supabase.from("orientacion_recursos").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/orientados");
    if (recurso?.orientado_id) revalidatePath(`/portal/orientados/${recurso.orientado_id}`);
    return actionOk({});
  } catch (e) {
    console.error("eliminarRecursoOrientacion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
