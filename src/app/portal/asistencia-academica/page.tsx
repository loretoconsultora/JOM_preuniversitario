import Link from "next/link";
import { Trash2, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { alumnosInscritos } from "@/lib/materias-inscritas";
import type { ClaseAsistencia, ClaseSesion, Profile } from "@/types/database";
import { TomarAsistenciaForm } from "@/components/tomar-asistencia-form";
import { InscribirAlumnosSection } from "@/components/inscribir-alumnos-section";
import { eliminarSesionAsistencia } from "./actions";

function formatFecha(fecha: string) {
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function AsistenciaAcademicaPage({
  searchParams,
}: {
  searchParams: Promise<{ materia?: string }>;
}) {
  const profile = await requireStaff();
  const { materia: materiaParam } = await searchParams;
  const supabase = await createClient();
  const isDocente = profile.role === "docente";

  if (isDocente) {
    const materiasList = await materiasGestionables(supabase, profile.id);
    const materiaSeleccionada =
      materiaParam && materiasList.some((m) => m.id === materiaParam) ? materiaParam : (materiasList[0]?.id ?? null);

    const [todosAlumnos, alumnosRoster, { data: sesiones }, inscritosResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
      materiaSeleccionada
        ? alumnosInscritos(supabase, materiaSeleccionada)
        : Promise.resolve([] as Profile[]),
      materiaSeleccionada
        ? supabase.from("clase_sesiones").select("*").eq("materia_id", materiaSeleccionada).order("fecha", { ascending: false })
        : Promise.resolve({ data: [] as ClaseSesion[] }),
      materiaSeleccionada
        ? supabase.from("materia_alumnos").select("alumno_id").eq("materia_id", materiaSeleccionada)
        : Promise.resolve({ data: [] as { alumno_id: string }[] }),
    ]);
    const alumnosList = alumnosRoster;
    const todosAlumnosList = (todosAlumnos.data ?? []) as Profile[];
    const inscritosIds = (inscritosResult.data ?? []).map((i) => i.alumno_id);
    const sesionesList = (sesiones ?? []) as ClaseSesion[];

    let alumnosConCorreo: { id: string; nombre_completo: string; email: string | null }[] = todosAlumnosList.map(
      (a) => ({ id: a.id, nombre_completo: a.nombre_completo, email: null })
    );
    try {
      const admin = createAdminClient();
      const { data: usuarios } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const emailPorId = new Map(usuarios?.users.map((u) => [u.id, u.email ?? null]) ?? []);
      alumnosConCorreo = todosAlumnosList.map((a) => ({
        id: a.id,
        nombre_completo: a.nombre_completo,
        email: emailPorId.get(a.id) ?? null,
      }));
    } catch {
      // Si falla la consulta de correos, se sigue mostrando solo el nombre.
    }
    const sesionIds = sesionesList.map((s) => s.id);
    const { data: asistencias } =
      sesionIds.length > 0
        ? await supabase.from("clase_asistencias").select("*").in("sesion_id", sesionIds)
        : { data: [] as ClaseAsistencia[] };
    const asistenciasList = (asistencias ?? []) as ClaseAsistencia[];

    const presentesPorSesion = new Map<string, number>();
    const totalPorSesion = new Map<string, number>();
    for (const a of asistenciasList) {
      totalPorSesion.set(a.sesion_id, (totalPorSesion.get(a.sesion_id) ?? 0) + 1);
      if (a.presente) presentesPorSesion.set(a.sesion_id, (presentesPorSesion.get(a.sesion_id) ?? 0) + 1);
    }

    const tabClass = (activo: boolean) =>
      `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
      }`;

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Asistencia</h1>
          <p className="text-muted text-sm">Registra quién asistió a cada clase de tu materia</p>
        </div>

        {materiasList.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {materiasList.map((m) => (
              <Link
                key={m.id}
                href={`/portal/asistencia-academica?materia=${m.id}`}
                className={tabClass(m.id === materiaSeleccionada)}
              >
                {m.nombre}
              </Link>
            ))}
          </div>
        )}

        {!materiaSeleccionada ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">No tienes materias asignadas.</div>
        ) : todosAlumnosList.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay alumnos registrados.</div>
        ) : (
          <>
            <InscribirAlumnosSection
              materiaId={materiaSeleccionada}
              alumnos={alumnosConCorreo}
              inscritosIniciales={inscritosIds}
            />

            <TomarAsistenciaForm materiaId={materiaSeleccionada} alumnos={alumnosList} />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Historial de clases</p>
              {sesionesList.length === 0 ? (
                <p className="text-muted text-sm">Aún no has registrado ninguna clase.</p>
              ) : (
                <div className="glass overflow-hidden rounded-2xl">
                  {sesionesList.map((s, i) => (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-3 px-5 py-4 ${
                        i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium capitalize">{formatFecha(s.fecha)}</p>
                        {s.nota && <p className="text-muted text-xs">{s.nota}</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-muted inline-flex items-center gap-1 text-xs">
                          <Users size={13} />
                          {presentesPorSesion.get(s.id) ?? 0}/{totalPorSesion.get(s.id) ?? 0}
                        </span>
                        <form action={eliminarSesionAsistencia.bind(null, s.id)}>
                          <button
                            type="submit"
                            aria-label="Eliminar clase"
                            className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                          >
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Directora: reporte agregado de cumplimiento por alumno.
  const [{ data: alumnos }, { data: asistencias }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    supabase.from("clase_asistencias").select("*"),
  ]);
  const alumnosList = (alumnos ?? []) as Profile[];
  const asistenciasList = (asistencias ?? []) as ClaseAsistencia[];

  const resumenPorAlumno = new Map<string, { presentes: number; total: number }>();
  for (const a of asistenciasList) {
    const r = resumenPorAlumno.get(a.alumno_id) ?? { presentes: 0, total: 0 };
    r.total += 1;
    if (a.presente) r.presentes += 1;
    resumenPorAlumno.set(a.alumno_id, r);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">Cumplimiento de asistencia a clases por alumno, registrado por los docentes</p>
      </div>

      {alumnosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay alumnos registrados.</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                <th className="px-5 py-3 font-medium">Alumno</th>
                <th className="px-5 py-3 font-medium">Clases registradas</th>
                <th className="px-5 py-3 font-medium">Asistencias</th>
                <th className="px-5 py-3 font-medium">% de asistencia</th>
              </tr>
            </thead>
            <tbody>
              {alumnosList.map((a) => {
                const r = resumenPorAlumno.get(a.id);
                const pct = r && r.total > 0 ? Math.round((r.presentes / r.total) * 100) : null;
                return (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3 font-medium">{a.nombre_completo}</td>
                    <td className="px-5 py-3">{r?.total ?? 0}</td>
                    <td className="px-5 py-3">{r?.presentes ?? 0}</td>
                    <td className="px-5 py-3 font-semibold">{pct !== null ? `${pct}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
