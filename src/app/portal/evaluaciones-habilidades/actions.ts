"use server";

import { revalidatePath } from "next/cache";
import { requireTerapeuta } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearHabilidad(formData: FormData) {
  const profile = await requireTerapeuta();
  const nombre = String(formData.get("nombre") || "").trim();
  if (!nombre) throw new Error("El nombre de la habilidad es obligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("habilidades").insert({ nombre, creado_por: profile.id });
  if (error) throw new Error(error.message);

  revalidatePath("/portal/evaluaciones-habilidades");
}

export async function actualizarHabilidad(id: string, nombre: string) {
  await requireTerapeuta();
  const texto = nombre.trim();
  if (!texto) throw new Error("El nombre no puede estar vacío.");

  const supabase = await createClient();
  const { error } = await supabase.from("habilidades").update({ nombre: texto }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/evaluaciones-habilidades");
}

export async function eliminarHabilidad(id: string) {
  await requireTerapeuta();
  const supabase = await createClient();
  const { error } = await supabase.from("habilidades").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/portal/evaluaciones-habilidades");
}

export async function crearEvaluacion(
  pacienteId: string,
  calificaciones: { habilidad_id: string; calificacion: number }[],
  conclusiones: string
) {
  const profile = await requireTerapeuta();
  if (calificaciones.length === 0) throw new Error("Califica al menos una habilidad.");

  const supabase = await createClient();
  const { count } = await supabase
    .from("evaluaciones_habilidades")
    .select("id", { count: "exact", head: true })
    .eq("paciente_id", pacienteId);
  const numeroPeriodo = (count ?? 0) + 1;

  const { data: evaluacion, error } = await supabase
    .from("evaluaciones_habilidades")
    .insert({
      paciente_id: pacienteId,
      numero_periodo: numeroPeriodo,
      conclusiones: conclusiones.trim() || null,
      creado_por: profile.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: eCal } = await supabase.from("evaluacion_habilidad_calificaciones").insert(
    calificaciones.map((c) => ({
      evaluacion_id: evaluacion.id,
      habilidad_id: c.habilidad_id,
      calificacion: c.calificacion,
    }))
  );
  if (eCal) throw new Error(eCal.message);

  revalidatePath("/portal/evaluaciones-habilidades");
  revalidatePath(`/portal/pacientes/${pacienteId}`);
}
