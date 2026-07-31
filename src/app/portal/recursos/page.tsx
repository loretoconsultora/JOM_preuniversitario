import Link from "next/link";
import { Plus, Trash2, FileText, Link2, Eye } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Recurso, RecursoVista } from "@/types/database";
import { eliminarRecurso } from "./actions";

export default async function RecursosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isDocente = profile.role === "docente";
  const isStaff = profile.role === "docente" || profile.role === "directora";

  const [{ data: materias }, { data: recursos }, { data: vistas }, alumnosCountResult] = await Promise.all([
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("recursos").select("*").order("created_at", { ascending: false }),
    // RLS: el alumno solo ve las suyas, docente/directora ven todas.
    supabase.from("recurso_vistas").select("*"),
    isStaff
      ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "alumno")
      : Promise.resolve({ count: 0 }),
  ]);

  const materiasList = (materias ?? []) as Materia[];
  const recursosList = (recursos ?? []) as Recurso[];
  const vistasList = (vistas ?? []) as RecursoVista[];
  const materiaById = new Map(materiasList.map((m) => [m.id, m]));
  const totalAlumnos = alumnosCountResult.count ?? 0;

  const vistoPropioPorRecurso = new Set<string>();
  const vistosPorRecurso = new Map<string, number>();
  for (const vista of vistasList) {
    if (!isStaff) {
      vistoPropioPorRecurso.add(vista.recurso_id);
    } else {
      vistosPorRecurso.set(vista.recurso_id, (vistosPorRecurso.get(vista.recurso_id) ?? 0) + 1);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recursos</h1>
          <p className="text-muted text-sm">Materiales, presentaciones, videos y links de apoyo</p>
        </div>
        {isDocente && (
          <Link
            href="/portal/recursos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo recurso
          </Link>
        )}
      </div>

      {recursosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          {isDocente ? "Aún no has subido recursos." : "Todavía no hay recursos disponibles."}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recursosList.map((recurso) => {
            const materia = recurso.materia_id ? materiaById.get(recurso.materia_id) : null;
            const yaVisto = vistoPropioPorRecurso.has(recurso.id);
            const vistos = vistosPorRecurso.get(recurso.id) ?? 0;

            return (
              <div key={recurso.id} className="glass flex flex-col gap-3 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                      {materia?.nombre ?? "General"}
                    </span>
                    <h2 className="mt-2 flex items-center gap-1.5 font-semibold">
                      {recurso.tipo === "archivo" ? (
                        <FileText size={15} className="text-muted shrink-0" />
                      ) : (
                        <Link2 size={15} className="text-muted shrink-0" />
                      )}
                      {recurso.titulo}
                    </h2>
                  </div>
                  {isDocente && (
                    <form action={eliminarRecurso.bind(null, recurso.id)}>
                      <button
                        type="submit"
                        aria-label="Eliminar recurso"
                        className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                      >
                        <Trash2 size={15} />
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <a
                    href={`/portal/recursos/${recurso.id}/abrir`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-3.5 py-1.5 text-xs font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
                  >
                    {recurso.tipo === "archivo" ? "Abrir archivo" : "Abrir link"}
                  </a>

                  {!isStaff && yaVisto && (
                    <span className="text-muted inline-flex items-center gap-1 text-xs">
                      <Eye size={13} /> Ya lo viste
                    </span>
                  )}
                  {isStaff && (
                    <Link
                      href={`/portal/recursos/${recurso.id}`}
                      className="text-muted inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-fg"
                    >
                      <Eye size={13} />
                      {vistos}/{totalAlumnos} han visto
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
