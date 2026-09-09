"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);
}

export async function crearDocente(formData: FormData): Promise<ActionResult<{ email: string; password: string }>> {
  await requireDocente();

  const nombre_completo = String(formData.get("nombre_completo") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const passwordInput = String(formData.get("password") || "").trim();
  const materiaIds = formData.getAll("materia_ids").map((v) => String(v)).filter(Boolean);

  if (!nombre_completo || !email) {
    return actionError("Nombre y correo son obligatorios.");
  }

  const password = passwordInput.length >= 6 ? passwordInput : generarPasswordTemporal();

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "docente",
        nombre_completo,
      },
    });
    if (error) return actionError(error.message);

    if (materiaIds.length > 0 && data.user) {
      const { error: eMaterias } = await admin
        .from("materia_docentes")
        .insert(materiaIds.map((materia_id) => ({ materia_id, docente_id: data.user.id })));
      if (eMaterias) return actionError(eMaterias.message);
    }

    revalidatePath("/portal/docentes");
    return actionOk({ email, password });
  } catch (e) {
    console.error("crearDocente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}

export async function actualizarMateriasDocente(docenteId: string, materiaIds: string[]): Promise<ActionResult> {
  await requireDocente();

  try {
    const admin = createAdminClient();
    const { error: eDel } = await admin.from("materia_docentes").delete().eq("docente_id", docenteId);
    if (eDel) return actionError(eDel.message);

    if (materiaIds.length > 0) {
      const { error: eIns } = await admin
        .from("materia_docentes")
        .insert(materiaIds.map((materia_id) => ({ materia_id, docente_id: docenteId })));
      if (eIns) return actionError(eIns.message);
    }

    revalidatePath("/portal/docentes");
    return actionOk({});
  } catch (e) {
    console.error("actualizarMateriasDocente:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
