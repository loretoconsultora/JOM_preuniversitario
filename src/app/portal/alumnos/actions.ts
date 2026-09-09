"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);
}

export async function crearAlumno(formData: FormData): Promise<ActionResult<{ email: string; password: string }>> {
  await requireDocente();

  const nombre_completo = String(formData.get("nombre_completo") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const passwordInput = String(formData.get("password") || "").trim();

  if (!nombre_completo || !email) {
    return actionError("Nombre y correo son obligatorios.");
  }

  const password = passwordInput.length >= 6 ? passwordInput : generarPasswordTemporal();

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "alumno",
        nombre_completo,
      },
    });
    if (error) return actionError(error.message);

    revalidatePath("/portal/alumnos");
    return actionOk({ email, password });
  } catch (e) {
    console.error("crearAlumno:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
