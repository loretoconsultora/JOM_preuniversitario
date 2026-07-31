import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Evaluacion, Materia, Profile } from "@/types/database";

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

  const [{ data: alumno }, { data: evaluaciones }, { data: materias }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).eq("role", "alumno").single(),
    supabase.from("evaluaciones").select("*").eq("alumno_id", id).order("fecha", { ascending: false }),
    supabase.from("materias").select("*").order("nombre"),
  ]);

  if (!alumno) notFound();

  const alumnoData = alumno as Profile;
  const evaluacionesList = (evaluaciones ?? []) as Evaluacion[];
  const materiasList = (materias ?? []) as Materia[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));

  const promedios = materiasList.map((materia) => {
    const notas = evaluacionesList
      .filter((e) => e.materia_id === materia.id && e.calificacion !== null)
      .map((e) => e.calificacion as number);
    const promedio = notas.length > 0 ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
    return { materia, promedio };
  });

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
        <h2 className="mb-3 text-lg font-semibold">Evaluaciones</h2>
        {evaluacionesList.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
            Sin evaluaciones registradas todavía.
          </div>
        ) : (
          <div className="glass overflow-hidden rounded-2xl">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                  <th className="px-5 py-3 font-medium">Materia</th>
                  <th className="px-5 py-3 font-medium">Evaluación</th>
                  <th className="px-5 py-3 font-medium">Calificación</th>
                  <th className="px-5 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {evaluacionesList.map((ev) => (
                  <tr key={ev.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3">
                      <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                        {materiaById.get(ev.materia_id)?.nombre ?? "Materia"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>{ev.titulo}</div>
                      {ev.comentario && <div className="text-muted text-xs">{ev.comentario}</div>}
                    </td>
                    <td className="px-5 py-3 font-semibold">
                      {ev.calificacion !== null ? ev.calificacion : "—"}
                    </td>
                    <td className="text-muted px-5 py-3">{formatFecha(ev.fecha)}</td>
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
