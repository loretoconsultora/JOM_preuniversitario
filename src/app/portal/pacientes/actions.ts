"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearPaciente(formData: FormData) {
  const profile = await requireTerapeuta();

  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("El nombre es obligatorio.");
  const motivos = formData.getAll("motivos").map((m) => String(m).trim()).filter(Boolean);
  const alumno_id = String(formData.get("alumno_id") || "").trim() || null;
  const mesAlta = String(formData.get("fecha_alta") || "").trim();
  const fecha_alta = mesAlta ? `${mesAlta}-01` : undefined;

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
  if (error) throw new Error(error.message);

  revalidatePath("/portal/pacientes");
  redirect(`/portal/pacientes/${data.id}`);
}

export async function agregarNotaPaciente(pacienteId: string, contenido: string) {
  const profile = await requireTerapeuta();
  const texto = contenido.trim();
  if (!texto) throw new Error("Escribe una nota.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("paciente_notas")
    .insert({ paciente_id: pacienteId, contenido: texto, creado_por: profile.id });
  if (error) throw new Error(error.message);

  revalidatePath(`/portal/pacientes/${pacienteId}`);
}

export async function archivarPaciente(id: string, activo: boolean) {
  await requireTerapeuta();
  const supabase = await createClient();
  const { error } = await supabase.from("pacientes").update({ activo }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/portal/pacientes/${id}`);
  revalidatePath("/portal/pacientes");
}

// Solo se puede eliminar un paciente ya archivado, como salvaguarda extra
// contra borrados accidentales de un caso activo. Al borrar se eliminan en
// cascada sus sesiones/asistencia, evaluaciones y notas (fk on delete cascade).
export async function eliminarPaciente(id: string) {
  await requireTerapeuta();
  const supabase = await createClient();

  const { data: paciente, error: eSel } = await supabase
    .from("pacientes")
    .select("activo")
    .eq("id", id)
    .single();
  if (eSel || !paciente) throw new Error("Paciente no encontrado.");
  if (paciente.activo) throw new Error("Solo se pueden eliminar pacientes archivados.");

  const { error } = await supabase.from("pacientes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/pacientes");
  revalidatePath("/portal/asistencia");
  redirect("/portal/pacientes");
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
