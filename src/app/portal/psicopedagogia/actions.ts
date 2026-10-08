"use server";

import { revalidatePath } from "next/cache";
import { requirePsicopedagogia } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

export async function crearCasoPsicopedagogia(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requirePsicopedagogia();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre es obligatorio.");
  const motivo = String(formData.get("motivo") || "").trim();
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("psicopedagogia_casos")
      .insert({ profesional_id: profile.id, alumno_id, nombre, motivo: motivo || null })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    revalidatePath("/portal/psicopedagogia");
    return actionOk({ id: data.id as string });
  } catch (e) {
    console.error("crearCasoPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function editarCasoPsicopedagogia(id: string, formData: FormData): Promise<ActionResult> {
  await requirePsicopedagogia();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre es obligatorio.");
  const motivo = String(formData.get("motivo") || "").trim();
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("psicopedagogia_casos")
      .update({ alumno_id, nombre, motivo: motivo || null })
      .eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/psicopedagogia");
    revalidatePath(`/portal/psicopedagogia/${id}`);
    return actionOk({});
  } catch (e) {
    console.error("editarCasoPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function archivarCasoPsicopedagogia(id: string, activo: boolean): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("psicopedagogia_casos").update({ activo }).eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/psicopedagogia/${id}`);
    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("archivarCasoPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarCasoPsicopedagogia(id: string): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { data: caso, error: eSel } = await supabase
      .from("psicopedagogia_casos")
      .select("activo")
      .eq("id", id)
      .single();
    if (eSel || !caso) return actionError("No encontrado.");
    if (caso.activo) return actionError("Solo se pueden eliminar casos archivados.");

    const { error } = await supabase.from("psicopedagogia_casos").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("eliminarCasoPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

type AgendamientoInput =
  | { recurrente: true; diaSemana: number; hora: string; fechaInicio: string; fechaFin: string | null }
  | { recurrente: false; sesiones: { fecha: string; hora: string }[] };

export async function crearAgendamientoPsicopedagogia(casoId: string, input: AgendamientoInput): Promise<ActionResult> {
  const profile = await requirePsicopedagogia();

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
    const { error } = await supabase.from("psicopedagogia_sesiones").insert(
      filas.map((f) => ({
        caso_id: casoId,
        fecha: f.fecha,
        hora: f.hora,
        creado_por: profile.id,
      }))
    );
    if (error) return actionError(error.message);

    revalidatePath(`/portal/psicopedagogia/${casoId}`);
    return actionOk({});
  } catch (e) {
    console.error("crearAgendamientoPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarAsistenciaPsicopedagogia(sesionId: string, estado: "asistio" | "no_asistio"): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("psicopedagogia_sesiones").update({ estado }).eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("marcarAsistenciaPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarSesionPsicopedagogia(sesionId: string): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("psicopedagogia_sesiones").delete().eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("eliminarSesionPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarNotaSesionPsicopedagogia(sesionId: string, nota: string): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("psicopedagogia_sesiones").update({ nota: nota || null }).eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("guardarNotaSesionPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function reagendarSesionPsicopedagogia(sesionId: string, nuevaFecha: string, nuevaHora: string): Promise<ActionResult> {
  await requirePsicopedagogia();
  if (!nuevaFecha) return actionError("Indica la nueva fecha.");

  try {
    const supabase = await createClient();
    const { data: sesion, error: eSel } = await supabase
      .from("psicopedagogia_sesiones")
      .select("caso_id, creado_por")
      .eq("id", sesionId)
      .single();
    if (eSel || !sesion) return actionError("Sesión no encontrada.");

    const { data: nueva, error: eIns } = await supabase
      .from("psicopedagogia_sesiones")
      .insert({
        caso_id: sesion.caso_id,
        fecha: nuevaFecha,
        hora: nuevaHora || null,
        creado_por: sesion.creado_por,
      })
      .select("id")
      .single();
    if (eIns) return actionError(eIns.message);

    const { error: eUpd } = await supabase
      .from("psicopedagogia_sesiones")
      .update({ estado: "reagendada", reagendada_a_id: nueva.id })
      .eq("id", sesionId);
    if (eUpd) return actionError(eUpd.message);

    revalidatePath("/portal/psicopedagogia");
    return actionOk({});
  } catch (e) {
    console.error("reagendarSesionPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function agregarNotaPsicopedagogia(casoId: string, contenido: string): Promise<ActionResult> {
  const profile = await requirePsicopedagogia();
  if (!contenido.trim()) return actionError("Escribe una nota.");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("psicopedagogia_notas")
      .insert({ caso_id: casoId, contenido, creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/psicopedagogia/${casoId}`);
    return actionOk({});
  } catch (e) {
    console.error("agregarNotaPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarNotaPsicopedagogia(id: string, casoId: string): Promise<ActionResult> {
  await requirePsicopedagogia();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("psicopedagogia_notas").delete().eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/psicopedagogia/${casoId}`);
    return actionOk({});
  } catch (e) {
    console.error("eliminarNotaPsicopedagogia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
