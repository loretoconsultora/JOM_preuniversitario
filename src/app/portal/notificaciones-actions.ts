"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacionDocenteLeida(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("notificaciones_docente").update({ leida: true }).eq("id", id).eq("docente_id", profile.id);
  revalidatePath("/portal", "layout");
}

export async function marcarTodasNotificacionesDocenteLeidas() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notificaciones_docente")
    .update({ leida: true })
    .eq("docente_id", profile.id)
    .eq("leida", false);
  revalidatePath("/portal", "layout");
}

export async function marcarNotificacionAlumnoLeida(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("notificaciones_alumno").update({ leida: true }).eq("id", id).eq("alumno_id", profile.id);
  revalidatePath("/portal", "layout");
}

export async function marcarTodasNotificacionesAlumnoLeidas() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notificaciones_alumno")
    .update({ leida: true })
    .eq("alumno_id", profile.id)
    .eq("leida", false);
  revalidatePath("/portal", "layout");
}
