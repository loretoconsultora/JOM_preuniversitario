import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Profile, Recurso, RecursoVista } from "@/types/database";

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RecursoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  const supabase = await createClient();

  const { data: recurso } = await supabase.from("recursos").select("*").eq("id", id).single();
  if (!recurso) notFound();
  const recursoData = recurso as Recurso;

  const [{ data: materia }, { data: alumnos }, { data: vistas }] = await Promise.all([
    recursoData.materia_id
      ? supabase.from("materias").select("*").eq("id", recursoData.materia_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    supabase.from("recurso_vistas").select("*").eq("recurso_id", id),
  ]);

  const alumnosList = (alumnos ?? []) as Profile[];
  const vistasList = (vistas ?? []) as RecursoVista[];
  const vistaPorAlumno = new Map(vistasList.map((v) => [v.alumno_id, v]));

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Link href="/portal/recursos" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
        <ArrowLeft size={14} /> Volver a recursos
      </Link>

      <div>
        <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
          {(materia as Materia | null)?.nombre ?? "General"}
        </span>
        <h1 className="mt-2 text-2xl font-semibold">{recursoData.titulo}</h1>
        <p className="text-muted text-sm">
          {vistasList.length}/{alumnosList.length} alumnos lo han visto
        </p>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        {alumnosList.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted">Aún no hay alumnos registrados.</div>
        ) : (
          alumnosList.map((alumno, i) => {
            const vista = vistaPorAlumno.get(alumno.id);
            return (
              <div
                key={alumno.id}
                className={`flex items-center justify-between px-5 py-3 ${
                  i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
                }`}
              >
                <span className="text-sm font-medium">{alumno.nombre_completo}</span>
                {vista ? (
                  <span className="text-muted inline-flex items-center gap-1.5 text-xs">
                    <CheckCircle2 size={14} className="text-green-600" />
                    {formatFecha(vista.created_at)}
                  </span>
                ) : (
                  <span className="text-muted inline-flex items-center gap-1.5 text-xs">
                    <Circle size={14} /> Sin ver
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
