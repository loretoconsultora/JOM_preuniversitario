import type { createClient } from "@/lib/supabase/server";
import type { Materia } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Un docente sin filas en materia_docentes tiene acceso total (todas las
// materias); un docente con filas queda acotado solo a esas.
export async function materiasGestionables(supabase: Supabase, docenteId: string): Promise<Materia[]> {
  const [{ data: materias }, { data: asignadas }] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("materia_docentes").select("materia_id").eq("docente_id", docenteId),
  ]);
  const materiasList = (materias ?? []) as Materia[];
  const asignadasIds = new Set((asignadas ?? []).map((a) => a.materia_id as string));

  if (asignadasIds.size === 0) return materiasList;
  return materiasList.filter((m) => asignadasIds.has(m.id));
}

export async function esDocenteAcotado(supabase: Supabase, docenteId: string): Promise<boolean> {
  const { count } = await supabase
    .from("materia_docentes")
    .select("materia_id", { count: "exact", head: true })
    .eq("docente_id", docenteId);
  return (count ?? 0) > 0;
}
