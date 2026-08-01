"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);
}

export async function crearTerapeuta(formData: FormData) {
  await requireDocente();

  const nombre_completo = String(formData.get("nombre_completo") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const passwordInput = String(formData.get("password") || "").trim();

  if (!nombre_completo || !email) {
    throw new Error("Nombre y correo son obligatorios.");
  }

  const password = passwordInput.length >= 6 ? passwordInput : generarPasswordTemporal();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "terapeuta",
      nombre_completo,
    },
  });

  if (error) throw new Error(error.message);

  revalidatePath("/portal/terapeutas");
  redirect(`/portal/terapeutas?nuevo_correo=${encodeURIComponent(email)}&nueva_password=${encodeURIComponent(password)}`);
}
