import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.RESEND_FROM_EMAIL || "JOM Preuniversitario <onboarding@resend.dev>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jom-preuniversitario.vercel.app";

// Docentes que deben enterarse de una entrega en esta materia: los
// asignados explícitamente a ella o, si nadie tiene materias asignadas
// todavía, los docentes sin restricciones (mismo criterio "vacío = sin
// acotar" que rige el resto de la plataforma). Usa el cliente admin
// porque esto se llama desde acciones que corren con la sesión del
// alumno, que no tiene permiso para leer materia_docentes ni profiles
// ajenos.
async function docentesDeMateria(materiaId: string) {
  const admin = createAdminClient();
  const [{ data: asignados }, { data: todosDocentes }, { data: asignacionesTotales }] = await Promise.all([
    admin.from("materia_docentes").select("docente_id").eq("materia_id", materiaId),
    admin.from("profiles").select("id, nombre_completo").eq("role", "docente"),
    admin.from("materia_docentes").select("docente_id"),
  ]);

  const asignadosIds = new Set((asignados ?? []).map((a) => a.docente_id as string));
  const docentesConAsignacion = new Set((asignacionesTotales ?? []).map((a) => a.docente_id as string));
  const todos = (todosDocentes ?? []) as { id: string; nombre_completo: string }[];

  if (asignadosIds.size > 0) return todos.filter((d) => asignadosIds.has(d.id));
  return todos.filter((d) => !docentesConAsignacion.has(d.id));
}

export async function notificarDocentesEntrega(opts: {
  materiaId: string;
  alumnoNombre: string;
  tipo: "tarea" | "examen";
  titulo: string;
  tareaId?: string;
  examenId?: string;
}) {
  try {
    const docentes = await docentesDeMateria(opts.materiaId);
    if (docentes.length === 0) return;

    const esTarea = opts.tipo === "tarea";
    const admin = createAdminClient();

    // Notificación in-app: siempre, no depende de tener correo
    // configurado — así el docente se entera desde la campanita del
    // portal aunque no se haya configurado Resend todavía.
    const mensaje = `${opts.alumnoNombre} ${esTarea ? "entregó la tarea" : "presentó el examen"} "${opts.titulo}"`;
    await admin.from("notificaciones_docente").insert(
      docentes.map((d) => ({
        docente_id: d.id,
        mensaje,
        materia_id: opts.materiaId,
        tarea_id: esTarea ? (opts.tareaId ?? null) : null,
        examen_id: esTarea ? null : (opts.examenId ?? null),
      }))
    );

    // Correo (opcional): solo si RESEND_API_KEY está configurada.
    if (!resend) return;

    const { data: usuarios } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const emailPorId = new Map(usuarios?.users.map((u) => [u.id, u.email ?? null]) ?? []);
    const destinatarios = docentes.map((d) => emailPorId.get(d.id)).filter((e): e is string => Boolean(e));
    if (destinatarios.length === 0) return;

    const asunto = `${opts.alumnoNombre} entregó ${esTarea ? "la tarea" : "el examen"} "${opts.titulo}"`;
    const enlace = `${SITE_URL}/portal/${esTarea ? "tareas" : "examenes"}`;
    const html = `
      <p><strong>${opts.alumnoNombre}</strong> subió una nueva respuesta para ${esTarea ? "la tarea" : "el examen"} <strong>${opts.titulo}</strong>.</p>
      <p>Favor de entrar a la plataforma para revisar y calificar.</p>
      <p><a href="${enlace}">Ir a la plataforma</a></p>
    `;

    await resend.emails.send({ from: FROM, to: destinatarios, subject: asunto, html });
  } catch (e) {
    // Un fallo al notificar nunca debe tumbar la entrega del alumno.
    console.error("No se pudo notificar la entrega:", e);
  }
}
