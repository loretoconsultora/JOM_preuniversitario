import type { createClient } from "@/lib/supabase/server";
import type { Materia, Profile } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Un alumno sin inscripciones ve todas las materias (comportamiento
// actual, sin acotar); con al menos una inscripción, solo ve esas.
export async function materiasInscritas(supabase: Supabase, alumnoId: string): Promise<Materia[]> {
  const [{ data: materias }, { data: inscritas }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("materia_alumnos").select("materia_id").eq("alumno_id", alumnoId),
  ]);
  const materiasList = (materias ?? []) as Materia[];
  const inscritasIds = new Set((inscritas ?? []).map((i) => i.materia_id as string));

  if (inscritasIds.size === 0) return materiasList;
  return materiasList.filter((m) => inscritasIds.has(m.id));
}

// Misma lógica desde el lado de la materia: si nadie ha sido inscrito
// explícitamente, el roster son todos los alumnos (para no bloquear
// asistencia antes de que un docente empiece a curar su lista).
export async function alumnosInscritos(supabase: Supabase, materiaId: string): Promise<Profile[]> {
  const [{ data: alumnos }, { data: inscritos }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    supabase.from("materia_alumnos").select("alumno_id").eq("materia_id", materiaId),
  ]);
  const alumnosList = (alumnos ?? []) as Profile[];
  const inscritosIds = new Set((inscritos ?? []).map((i) => i.alumno_id as string));

  if (inscritosIds.size === 0) return alumnosList;
  return alumnosList.filter((a) => inscritosIds.has(a.id));
}
