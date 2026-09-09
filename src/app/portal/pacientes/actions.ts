"use server";

import { revalidatePath } from "next/cache";
import { requireTerapeuta, requireTerapeutaODirectora } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PACIENTE_DOCUMENTOS_BUCKET } from "@/lib/storage";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";
import type { AsistenciaSaludTipo } from "@/types/database";

export async function crearPaciente(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const profile = await requireTerapeuta();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) return actionError("El nombre es obligatorio.");
  const motivos = formData.getAll("motivos").map((m) => String(m).trim()).filter(Boolean);
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;
  const mesAlta = String(formData.get("fecha_alta") || "").trim();
  const fecha_alta = mesAlta ? `${mesAlta}-01` : undefined;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("pacientes")
      .insert({
        terapeuta_id: profile.id,
        alumno_id,
        nombre,
        motivos,
        ...(fecha_alta ? { fecha_alta } : {}),
      })
      .select("id")
      .single();
    if (error) return actionError(error.message);

    revalidatePath("/portal/pacientes");
    return actionOk({ id: data.id });
  } catch (e) {
    console.error("crearPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function agregarNotaPaciente(pacienteId: string, contenido: string): Promise<ActionResult> {
  const profile = await requireTerapeuta();
  if (!contenido) return actionError("Escribe una nota.");

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("paciente_notas")
      .insert({ paciente_id: pacienteId, contenido, tipo: "general", creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/pacientes/${pacienteId}`);
    return actionOk({});
  } catch (e) {
    console.error("agregarNotaPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarPacienteSalud(
  pacienteId: string,
  datos: {
    medicacion_toma: boolean;
    medicacion_cual: string | null;
    medicacion_dosis: string | null;
    medicacion_desde: string | null;
    asistencia_tipos: AsistenciaSaludTipo[];
    asistencia_detalle: string | null;
  }
): Promise<ActionResult> {
  const profile = await requireTerapeutaODirectora();

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("paciente_salud").upsert({
      paciente_id: pacienteId,
      ...datos,
      actualizado_por: profile.id,
      updated_at: new Date().toISOString(),
    });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/pacientes/${pacienteId}`);
    revalidatePath("/portal/seguimiento-salud");
    return actionOk({});
  } catch (e) {
    console.error("guardarPacienteSalud:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function registrarDocumentoPaciente(
  pacienteId: string,
  archivo: { storage_path: string; nombre_archivo: string; tipo_mime: string | null; tamano_bytes: number }
): Promise<ActionResult> {
  const profile = await requireTerapeuta();

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("paciente_documentos")
      .insert({ paciente_id: pacienteId, ...archivo, creado_por: profile.id });
    if (error) return actionError(error.message);

    revalidatePath(`/portal/pacientes/${pacienteId}`);
    return actionOk({});
  } catch (e) {
    console.error("registrarDocumentoPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function eliminarDocumentoPaciente(id: string): Promise<ActionResult> {
  await requireTerapeuta();

  try {
    const supabase = await createClient();
    const { data: documento } = await supabase
      .from("paciente_documentos")
      .select("storage_path, paciente_id")
      .eq("id", id)
      .single();

    if (documento?.storage_path) {
      await supabase.storage.from(PACIENTE_DOCUMENTOS_BUCKET).remove([documento.storage_path]);
    }

    const { error } = await supabase.from("paciente_documentos").delete().eq("id", id);
    if (error) return actionError(error.message);

    if (documento?.paciente_id) revalidatePath(`/portal/pacientes/${documento.paciente_id}`);
    return actionOk({});
  } catch (e) {
    console.error("eliminarDocumentoPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function archivarPaciente(id: string, activo: boolean): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("pacientes").update({ activo }).eq("id", id);
    if (error) return actionError(error.message);
    revalidatePath(`/portal/pacientes/${id}`);
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("archivarPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarFechaAltaPaciente(id: string, mesAlta: string): Promise<ActionResult> {
  await requireTerapeuta();
  const mes = String(mesAlta || "").trim();
  if (!mes) return actionError("Indica el mes.");
  const fecha_alta = `${mes}-01`;

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("pacientes").update({ fecha_alta }).eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath(`/portal/pacientes/${id}`);
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("actualizarFechaAltaPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

// Solo se puede eliminar un paciente ya archivado, como salvaguarda extra
// contra borrados accidentales de un caso activo. Al borrar se eliminan en
// cascada sus sesiones/asistencia, evaluaciones y notas (fk on delete cascade).
export async function eliminarPaciente(id: string): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();

    const { data: paciente, error: eSel } = await supabase
      .from("pacientes")
      .select("activo")
      .eq("id", id)
      .single();
    if (eSel || !paciente) return actionError("Paciente no encontrado.");
    if (paciente.activo) return actionError("Solo se pueden eliminar pacientes archivados.");

    const { error } = await supabase.from("pacientes").delete().eq("id", id);
    if (error) return actionError(error.message);

    revalidatePath("/portal/pacientes");
    revalidatePath("/portal/asistencia");
    return actionOk({});
  } catch (e) {
    console.error("eliminarPaciente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

type AgendamientoInput =
  | { recurrente: true; diaSemana: number; hora: string; fechaInicio: string; fechaFin: string | null }
  | { recurrente: false; sesiones: { fecha: string; hora: string }[] };

export async function crearAgendamiento(pacienteId: string, input: AgendamientoInput): Promise<ActionResult> {
  const profile = await requireTerapeuta();

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
    const { error } = await supabase.from("paciente_sesiones").insert(
      filas.map((f) => ({
        paciente_id: pacienteId,
        fecha: f.fecha,
        hora: f.hora,
        creado_por: profile.id,
      }))
    );
    if (error) return actionError(error.message);

    revalidatePath(`/portal/pacientes/${pacienteId}`);
    revalidatePath("/portal/asistencia");
    return actionOk({});
  } catch (e) {
    console.error("crearAgendamiento:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function marcarAsistencia(sesionId: string, estado: "asistio" | "no_asistio"): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("paciente_sesiones").update({ estado }).eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/asistencia");
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("marcarAsistencia:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

// Solo pensada para sesiones programadas/próximas (ver UI): elimina la fila
// por completo, a diferencia de reagendarSesion que conserva el historial.
export async function eliminarSesion(sesionId: string): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("paciente_sesiones").delete().eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/asistencia");
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("eliminarSesion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function guardarNotaSesion(sesionId: string, nota: string): Promise<ActionResult> {
  await requireTerapeuta();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("paciente_sesiones")
      .update({ nota: nota || null })
      .eq("id", sesionId);
    if (error) return actionError(error.message);
    revalidatePath("/portal/asistencia");
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("guardarNotaSesion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function reagendarSesion(sesionId: string, nuevaFecha: string, nuevaHora: string): Promise<ActionResult> {
  await requireTerapeuta();
  if (!nuevaFecha) return actionError("Indica la nueva fecha.");

  try {
    const supabase = await createClient();
    const { data: sesion, error: eSel } = await supabase
      .from("paciente_sesiones")
      .select("paciente_id, creado_por")
      .eq("id", sesionId)
      .single();
    if (eSel || !sesion) return actionError("Sesión no encontrada.");

    const { data: nueva, error: eIns } = await supabase
      .from("paciente_sesiones")
      .insert({
        paciente_id: sesion.paciente_id,
        fecha: nuevaFecha,
        hora: nuevaHora || null,
        creado_por: sesion.creado_por,
      })
      .select("id")
      .single();
    if (eIns) return actionError(eIns.message);

    const { error: eUpd } = await supabase
      .from("paciente_sesiones")
      .update({ estado: "reagendada", reagendada_a_id: nueva.id })
      .eq("id", sesionId);
    if (eUpd) return actionError(eUpd.message);

    revalidatePath("/portal/asistencia");
    revalidatePath("/portal/pacientes");
    return actionOk({});
  } catch (e) {
    console.error("reagendarSesion:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
