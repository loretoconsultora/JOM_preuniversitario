"use server";

import { revalidatePath } from "next/cache";
import { requireDocente } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function crearSesionAsistencia(
  materiaId: string,
  fecha: string,
  nota: string,
  asistencias: { alumno_id: string; presente: boolean }[]
) {
  const profile = await requireDocente();
  if (!materiaId) throw new Error("Selecciona una materia.");
  if (!fecha) throw new Error("Indica la fecha de la clase.");
  if (asistencias.length === 0) throw new Error("No hay alumnos para registrar.");

  const supabase = await createClient();
  const { data: sesion, error } = await supabase
    .from("clase_sesiones")
    .insert({ materia_id: materiaId, fecha, nota: nota.trim() || null, creado_por: profile.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: eAsist } = await supabase.from("clase_asistencias").insert(
    asistencias.map((a) => ({ sesion_id: sesion.id, alumno_id: a.alumno_id, presente: a.presente }))
  );
  if (eAsist) throw new Error(eAsist.message);

  revalidatePath("/portal/asistencia-academica");
}

export async function eliminarSesionAsistencia(id: string) {
  await requireDocente();
  const supabase = await createClient();
  const { error } = await supabase.from("clase_sesiones").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/portal/asistencia-academica");
}

export async function actualizarInscripcionMateria(materiaId: string, alumnoIds: string[]) {
  const profile = await requireDocente();
  const supabase = await createClient();

  const { error: eDel } = await supabase.from("materia_alumnos").delete().eq("materia_id", materiaId);
  if (eDel) throw new Error(eDel.message);

  if (alumnoIds.length > 0) {
    const { error: eIns } = await supabase
      .from("materia_alumnos")
      .insert(alumnoIds.map((alumno_id) => ({ materia_id: materiaId, alumno_id, inscrito_por: profile.id })));
    if (eIns) throw new Error(eIns.message);
  }

  revalidatePath("/portal/asistencia-academica");
  revalidatePath("/portal/temario");
  revalidatePath("/portal/tareas");
  revalidatePath("/portal/examenes");
  revalidatePath("/portal/calificaciones");
}
