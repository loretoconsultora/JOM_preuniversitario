import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardCheck, GraduationCap } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasInscritas } from "@/lib/materias-inscritas";
import { progresoPorMateria } from "@/lib/progreso-materia";
import type { Calificacion, Materia, Profile } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AlumnoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: alumno }, { data: calificaciones }, { data: materias }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "alumno").single(),
    supabase.from("calificaciones").select("*").eq("alumno_id", id).order("fecha", { ascending: false }),
    supabase.from("materias").select("*").order("nombre"),
  ]);

  if (!alumno) notFound();

  const alumnoData = alumno as Profile;
  const calificacionesList = (calificaciones ?? []) as Calificacion[];
  const materiasList = (materias ?? []) as Materia[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));

  const promedios = materiasList.map((materia) => {
    const notas = calificacionesList
      .filter((c) => c.materia_id === materia.id && c.calificacion !== null)
      .map((c) => c.calificacion as number);
    const promedio = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    return { materia, promedio };
  });

  // Solo las materias en las que el alumno está inscrito (o todas, si nadie
  // lo ha inscrito explícitamente todavía — mismo criterio "vacío = sin
  // acotar" que en Temario/Tareas/Exámenes).
  const materiasDelAlumno = await materiasInscritas(supabase, id);
  const progresoMap = await progresoPorMateria(
    supabase,
    id,
    materiasDelAlumno.map((m) => m.id)
  );

  return (
    <div className="flex flex-col gap-6">
      <Link href="/portal/alumnos" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a alumnos
      </Link>

      <div>
        <h1 className="text-2xl font-semibold">{alumnoData.nombre_completo}</h1>
        <p className="text-muted text-sm">Rendimiento por materia</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {promedios.map(({ materia, promedio }) => (
          <div key={materia.id} className="glass rounded-2xl p-5">
            <p className="text-muted text-xs uppercase">{materia.nombre}</p>
            <p className="mt-1 text-2xl font-semibold">{promedio !== null ? promedio.toFixed(1) : "—"}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Avance del temario</h2>
        <p className="text-muted -mt-2 mb-3 text-xs">
          Por materia, según los archivos que abrió, las tareas que entregó/presentó y los exámenes que respondió.
        </p>
        {materiasDelAlumno.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            Este alumno no está inscrito en ninguna materia todavía.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {materiasDelAlumno.map((materia) => {
              const progreso = progresoMap.get(materia.id) ?? { total: 0, completos: 0, pct: 0 };
              return (
                <div key={materia.id} className="glass rounded-2xl p-5">
                  <p className="text-muted text-xs uppercase">{materia.nombre}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                      <div className="bg-jom-pink h-full rounded-full" style={{ width: `${progreso.pct}%` }} />
                    </div>
                    <span className="text-xs font-semibold">{progreso.pct}%</span>
                  </div>
                  <p className="text-muted mt-1.5 text-xs">
                    {progreso.total === 0
                      ? "Sin actividades para medir avance"
                      : `${progreso.completos} de ${progreso.total} temas avanzados`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Calificaciones</h2>
        {calificacionesList.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            Sin calificaciones registradas todavía.
          </div>
        ) : (
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                  <th className="px-5 py-3 font-medium">Materia</th>
                  <th className="px-5 py-3 font-medium">Título</th>
                  <th className="px-5 py-3 font-medium">Calificación</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {calificacionesList.map((cal) => (
                  <tr key={cal.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                        {materiaById.get(cal.materia_id)?.nombre ?? "Materia"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {cal.tarea_id ? (
                          <ClipboardCheck size={13} className="text-muted shrink-0" />
                        ) : (
                          <GraduationCap size={13} className="text-muted shrink-0" />
                        )}
                        {cal.titulo}
                      </div>
                      {cal.comentario && <div className="text-muted text-xs">{cal.comentario}</div>}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {cal.calificacion !== null ? cal.calificacion : "—"}
                    </td>
                    <td className="text-muted px-5 py-3">{formatFecha(cal.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
