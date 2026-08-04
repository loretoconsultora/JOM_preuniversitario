"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireDocente } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function generarPasswordTemporal() {
  return Math.random().toString(36).slice(-5) + Math.random().toString(36).slice(-5);
}

export async function crearDocente(formData: FormData) {
  await requireDocente();

  const nombre_completo = String(formData.get("nombre_completo") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const passwordInput = String(formData.get("password") || "").trim();
  const materiaIds = formData.getAll("materia_ids").map((v) => String(v)).filter(Boolean);

  if (!nombre_completo || !email) {
    throw new Error("Nombre y correo son obligatorios.");
  }

  const password = passwordInput.length >= 6 ? passwordInput : generarPasswordTemporal();

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

  if (error) throw new Error(error.message);

  if (materiaIds.length > 0 && data.user) {
    const { error: eMaterias } = await admin
      .from("materia_docentes")
      .insert(materiaIds.map((materia_id) => ({ materia_id, docente_id: data.user.id })));
    if (eMaterias) throw new Error(eMaterias.message);
  }

  revalidatePath("/portal/docentes");
  redirect(`/portal/docentes?nuevo_correo=${encodeURIComponent(email)}&nueva_password=${encodeURIComponent(password)}`);
}

export async function actualizarMateriasDocente(docenteId: string, materiaIds: string[]) {
  await requireDocente();

  const admin = createAdminClient();
  const { error: eDel } = await admin.from("materia_docentes").delete().eq("docente_id", docenteId);
  if (eDel) throw new Error(eDel.message);

  if (materiaIds.length > 0) {
    const { error: eIns } = await admin
      .from("materia_docentes")
      .insert(materiaIds.map((materia_id) => ({ materia_id, docente_id: docenteId })));
    if (eIns) throw new Error(eIns.message);
  }

  revalidatePath("/portal/docentes");
}
