"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearPaciente(formData: FormData) {
  const profile = await requireTerapeuta();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  const motivo_referencia = String(formData.get("motivo_referencia") || "").trim() || null;
  const nota = String(formData.get("nota") || "").trim() || null;
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;
  const fecha_alta = String(formData.get("fecha_alta") || "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pacientes")
    .insert({
      terapeuta_id: profile.id,
      alumno_id,
      nombre,
      motivo_referencia,
      nota,
      ...(fecha_alta ? { fecha_alta } : {}),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/portal/pacientes");
  redirect(`/portal/pacientes/${data.id}`);
}

export async function actualizarPaciente(id: string, formData: FormData) {
  await requireTerapeuta();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  const motivo_referencia = String(formData.get("motivo_referencia") || "").trim() || null;
  const nota = String(formData.get("nota") || "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").update({ nombre, motivo_referencia, nota }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/portal/pacientes/${id}`);
  revalidatePath("/portal/pacientes");
}

export async function archivarPaciente(id: string, activo: boolean) {
  await requireTerapeuta();
  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/pacientes/${id}`);
  revalidatePath("/portal/pacientes");
}

type AgendamientoInput =
  | { recurrente: true; diaSemana: number; hora: string; fechaInicio: string; fechaFin: string | null }
  | { recurrente: false; sesiones: { fecha: string; hora: string }[] };

export async function crearAgendamiento(pacienteId: string, input: AgendamientoInput) {
  const profile = await requireTerapeuta();
  const supabase = await createClient();

  let filas: { fecha: string; hora: string | null }[] = [];

  if (input.recurrente) {
    if (!input.hora) throw new Error("Indica la hora de la sesión.");
    if (!input.fechaInicio) throw new Error("Indica la fecha de inicio.");
    const cursor = new Date(`${input.fechaInicio}T00:00:00`);
    if (Number.isNaN(cursor.getTime())) throw new Error("Fecha de inicio inválida.");
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

  if (filas.length === 0) throw new Error("Agrega al menos una sesión.");

  const { error } = await supabase.from("paciente_sesiones").insert(
    filas.map((f) => ({
      paciente_id: pacienteId,
      fecha: f.fecha,
      hora: f.hora,
      creado_por: profile.id,
    }))
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/portal/pacientes/${pacienteId}`);
  revalidatePath("/portal/asistencia");
}

export async function marcarAsistencia(sesionId: string, estado: "asistio" | "no_asistio") {
  await requireTerapeuta();
  const supabase = await createClient();
  const { error } = await supabase.from("paciente_sesiones").update({ estado }).eq("id", sesionId);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/asistencia");
  revalidatePath("/portal/pacientes");
}

export async function guardarNotaSesion(sesionId: string, nota: string) {
  await requireTerapeuta();
  const supabase = await createClient();
  const { error } = await supabase
    .from("paciente_sesiones")
    .update({ nota: nota.trim() || null })
    .eq("id", sesionId);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/asistencia");
  revalidatePath("/portal/pacientes");
}

export async function reagendarSesion(sesionId: string, nuevaFecha: string, nuevaHora: string) {
  await requireTerapeuta();
  if (!nuevaFecha) throw new Error("Indica la nueva fecha.");
  const supabase = await createClient();

  const { data: sesion, error: eSel } = await supabase
    .from("paciente_sesiones")
    .select("paciente_id, creado_por")
    .eq("id", sesionId)
    .single();
  if (eSel || !sesion) throw new Error("Sesión no encontrada.");

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
  if (eIns) throw new Error(eIns.message);

  const { error: eUpd } = await supabase
    .from("paciente_sesiones")
    .update({ estado: "reagendada", reagendada_a_id: nueva.id })
    .eq("id", sesionId);
  if (eUpd) throw new Error(eUpd.message);

  revalidatePath("/portal/asistencia");
  revalidatePath("/portal/pacientes");
}
