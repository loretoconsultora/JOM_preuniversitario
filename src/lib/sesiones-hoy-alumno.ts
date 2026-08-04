import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SesionHoy = { id: string; hora: string | null; terapeutaNombre: string };

// Sesiones de terapia agendadas para hoy que le tocan a este alumno, leídas
// en vivo de la agenda del terapeuta (pacientes + paciente_sesiones) — no
// depende de un cron ni de una notificación guardada, así que siempre
// refleja el estado real de la agenda. Usa el cliente admin porque
// paciente_sesiones solo es legible por el terapeuta dueño vía RLS.
export async function sesionesTerapiaHoy(alumnoId: string): Promise<SesionHoy[]> {
  const admin = createAdminClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const { data: misPacientes } = await admin.from("pacientes").select("id, terapeuta_id").eq("alumno_id", alumnoId);
  if (!misPacientes || misPacientes.length === 0) return [];

  const pacienteIds = misPacientes.map((p) => p.id as string);
  const { data: sesiones } = await admin
    .from("paciente_sesiones")
    .select("id, paciente_id, hora")
    .in("paciente_id", pacienteIds)
    .eq("fecha", hoy)
    .eq("estado", "pendiente");
  if (!sesiones || sesiones.length === 0) return [];

  const terapeutaIdPorPaciente = new Map(misPacientes.map((p) => [p.id as string, p.terapeuta_id as string]));
  const terapeutaIds = [...new Set(Array.from(terapeutaIdPorPaciente.values()))];
  const { data: terapeutas } = await admin.from("profiles").select("id, nombre_completo").in("id", terapeutaIds);
  const nombrePorId = new Map((terapeutas ?? []).map((t) => [t.id as string, t.nombre_completo as string]));

  return sesiones.map((s) => ({
    id: s.id as string,
    hora: s.hora as string | null,
    terapeutaNombre: nombrePorId.get(terapeutaIdPorPaciente.get(s.paciente_id as string) ?? "") ?? "tu terapeuta",
  }));
}
