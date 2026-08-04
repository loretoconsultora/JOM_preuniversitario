"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function marcarNotificacionLeida(id: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase.from("notificaciones_docente").update({ leida: true }).eq("id", id).eq("docente_id", profile.id);
  revalidatePath("/portal", "layout");
}

export async function marcarTodasNotificacionesLeidas() {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("notificaciones_docente")
    .update({ leida: true })
    .eq("docente_id", profile.id)
    .eq("leida", false);
  revalidatePath("/portal", "layout");
}
