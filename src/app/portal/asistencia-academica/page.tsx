import Link from "next/link";
import { Trash2, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { alumnosInscritos } from "@/lib/materias-inscritas";
import type { ClaseAsistencia, ClaseNotaAlumno, ClaseSesion, Materia, Profile, Tema } from "@/types/database";
import { TomarAsistenciaForm } from "@/components/tomar-asistencia-form";
import { InscribirAlumnosSection } from "@/components/inscribir-alumnos-section";
import { MateriaSelector } from "@/components/materia-selector";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { NotasAlumnosClaseSection } from "@/components/notas-alumnos-clase-section";
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
  searchParams: Promise<{ materia?: string; alumno?: string }>;
}) {
  const profile = await requireStaff();
  const { materia: materiaParam, alumno: alumnoParam } = await searchParams;
  const supabase = await createClient();
  const isDocente = profile.role === "docente";

  if (isDocente) {
    const materiasList = await materiasGestionables(supabase, profile.id);
    const materiaSeleccionada =
      materiaParam && materiasList.some((m) => m.id === materiaParam) ? materiaParam : (materiasList[0]?.id ?? null);

    const [todosAlumnos, alumnosRoster, { data: sesiones }, inscritosResult, { data: temas }] = await Promise.all([
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
      materiaSeleccionada
        ? supabase.from("temas").select("*").eq("materia_id", materiaSeleccionada).order("orden")
        : Promise.resolve({ data: [] as Tema[] }),
    ]);
    const alumnosList = alumnosRoster;
    const todosAlumnosList = (todosAlumnos.data ?? []) as Profile[];
    const inscritosIds = (inscritosResult.data ?? []).map((i) => i.alumno_id);
    const sesionesList = (sesiones ?? []) as ClaseSesion[];
    const temasList = (temas ?? []) as Tema[];
    const temaById = new Map(temasList.map((t) => [t.id, t.titulo]));

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
    const [{ data: asistencias }, { data: notasAlumno }] =
      sesionIds.length > 0
        ? await Promise.all([
            supabase.from("clase_asistencias").select("*").in("sesion_id", sesionIds),
            supabase.from("clase_notas_alumno").select("*").in("sesion_id", sesionIds),
          ])
        : [{ data: [] as ClaseAsistencia[] }, { data: [] as ClaseNotaAlumno[] }];
    const asistenciasList = (asistencias ?? []) as ClaseAsistencia[];
    const notasAlumnoList = (notasAlumno ?? []) as ClaseNotaAlumno[];
    const notaPorSesionYAlumno = new Map(notasAlumnoList.map((n) => [`${n.sesion_id}:${n.alumno_id}`, n.nota]));
    const nombrePorAlumnoId = new Map(todosAlumnosList.map((a) => [a.id, a.nombre_completo]));

    const presentesPorSesion = new Map<string, number>();
    const totalPorSesion = new Map<string, number>();
    const asistenciasPorSesion = new Map<string, ClaseAsistencia[]>();
    for (const a of asistenciasList) {
      totalPorSesion.set(a.sesion_id, (totalPorSesion.get(a.sesion_id) ?? 0) + 1);
      if (a.presente) presentesPorSesion.set(a.sesion_id, (presentesPorSesion.get(a.sesion_id) ?? 0) + 1);
      const lista = asistenciasPorSesion.get(a.sesion_id) ?? [];
      lista.push(a);
      asistenciasPorSesion.set(a.sesion_id, lista);
    }

    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Asistencia</h1>
          <p className="text-muted text-sm">Registra quién asistió a cada clase de tu materia</p>
        </div>

        {materiasList.length > 1 && materiaSeleccionada && (
          <MateriaSelector
            materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
            seleccionada={materiaSeleccionada}
            basePath="/portal/asistencia-academica"
          />
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

            <TomarAsistenciaForm
              key={materiaSeleccionada}
              materiaId={materiaSeleccionada}
              temas={temasList}
              alumnos={alumnosList}
            />

            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">Historial de clases</p>
              {sesionesList.length === 0 ? (
                <p className="text-muted text-sm">Aún no has registrado ninguna clase.</p>
              ) : (
                <div className="glass overflow-hidden rounded-2xl">
                  {sesionesList.map((s, i) => (
                    <details
                      key={s.id}
                      className={`group ${i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""}`}
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
                        <div>
                          <p className="text-sm font-medium capitalize">{formatFecha(s.fecha)}</p>
                          {s.tema_id && temaById.has(s.tema_id) && (
                            <span className="mr-1.5 inline-block rounded-full bg-jom-yellow/40 px-2 py-0.5 text-xs font-medium text-jom-ink">
                              {temaById.get(s.tema_id)}
                            </span>
                          )}
                          {s.nota && <p className="text-muted text-xs">{s.nota}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-muted inline-flex items-center gap-1 text-xs">
                            <Users size={13} />
                            {presentesPorSesion.get(s.id) ?? 0}/{totalPorSesion.get(s.id) ?? 0}
                          </span>
                          <ConfirmDeleteButton
                            accion={eliminarSesionAsistencia.bind(null, s.id)}
                            mensaje="¿Eliminar esta clase? Se borrará también la asistencia registrada. Esto no se puede deshacer."
                            className="text-muted rounded-full p-1.5 transition-colors hover:bg-jom-pink/30 hover:text-jom-ink"
                          >
                            <Trash2 size={14} />
                          </ConfirmDeleteButton>
                        </div>
                      </summary>
                      <div className="border-t border-black/5 dark:border-white/5">
                        <p className="px-5 pt-3 text-xs font-medium uppercase text-muted">Notas por alumno</p>
                        <NotasAlumnosClaseSection
                          sesionId={s.id}
                          alumnos={(asistenciasPorSesion.get(s.id) ?? [])
                            .slice()
                            .sort((a, b) => (nombrePorAlumnoId.get(a.alumno_id) ?? "").localeCompare(nombrePorAlumnoId.get(b.alumno_id) ?? ""))
                            .map((a) => ({
                              id: a.alumno_id,
                              nombre_completo: nombrePorAlumnoId.get(a.alumno_id) ?? "Alumno",
                              presente: a.presente,
                              nota: notaPorSesionYAlumno.get(`${s.id}:${a.alumno_id}`) ?? "",
                            }))}
                        />
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Directora: reporte de cumplimiento por alumno, con filtro opcional por materia.
  const { data: materiasAll } = await supabase.from("materias").select("*").order("nombre");
  const materiasList = (materiasAll ?? []) as Materia[];
  const materiaId = materiaParam && materiasList.some((m) => m.id === materiaParam) ? materiaParam : "";
  const materiaSeleccionada = materiaId ? materiasList.find((m) => m.id === materiaId) : null;

  const { data: alumnos } = await supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo");
  const alumnosList = (alumnos ?? []) as Profile[];

  let asistenciasList: ClaseAsistencia[] = [];
  if (materiaId) {
    const { data: sesionesMateria } = await supabase.from("clase_sesiones").select("id").eq("materia_id", materiaId);
    const sesionIds = (sesionesMateria ?? []).map((s) => s.id);
    if (sesionIds.length > 0) {
      const { data: asistencias } = await supabase.from("clase_asistencias").select("*").in("sesion_id", sesionIds);
      asistenciasList = (asistencias ?? []) as ClaseAsistencia[];
    }
  } else {
    const { data: asistencias } = await supabase.from("clase_asistencias").select("*");
    asistenciasList = (asistencias ?? []) as ClaseAsistencia[];
  }

  const resumenPorAlumno = new Map<string, { presentes: number; total: number }>();
  for (const a of asistenciasList) {
    const r = resumenPorAlumno.get(a.alumno_id) ?? { presentes: 0, total: 0 };
    r.total += 1;
    if (a.presente) r.presentes += 1;
    resumenPorAlumno.set(a.alumno_id, r);
  }

  const alumnoId = alumnoParam && alumnosList.some((a) => a.id === alumnoParam) ? alumnoParam : "";
  const alumnoSeleccionado = alumnoId ? alumnosList.find((a) => a.id === alumnoId) : null;
  const hrefAlumno = (id: string) => `/portal/asistencia-academica?${materiaId ? `materia=${materiaId}&` : ""}alumno=${id}`;

  type NotaConContexto = { fecha: string; materiaNombre: string; docenteNombre: string; nota: string };
  let notasAlumno: NotaConContexto[] = [];
  if (alumnoId) {
    const { data: notas } = await supabase.from("clase_notas_alumno").select("*").eq("alumno_id", alumnoId);
    const notasList = (notas ?? []) as ClaseNotaAlumno[];
    if (notasList.length > 0) {
      const sesionIdsConNota = notasList.map((n) => n.sesion_id);
      const { data: sesionesConNota } = await supabase.from("clase_sesiones").select("*").in("id", sesionIdsConNota);
      const sesionesConNotaList = (sesionesConNota ?? []) as ClaseSesion[];
      const sesionPorId = new Map(sesionesConNotaList.map((s) => [s.id, s]));

      const materiaIdsConNota = [...new Set(sesionesConNotaList.map((s) => s.materia_id))];
      const docenteIdsConNota = [...new Set(notasList.map((n) => n.creado_por))];
      const [{ data: materiasConNota }, { data: docentesConNota }] = await Promise.all([
        materiaIdsConNota.length > 0
          ? supabase.from("materias").select("*").in("id", materiaIdsConNota)
          : Promise.resolve({ data: [] as Materia[] }),
        docenteIdsConNota.length > 0
          ? supabase.from("profiles").select("*").in("id", docenteIdsConNota)
          : Promise.resolve({ data: [] as Profile[] }),
      ]);
      const materiaNombrePorId = new Map(((materiasConNota ?? []) as Materia[]).map((m) => [m.id, m.nombre]));
      const docenteNombrePorId = new Map(((docentesConNota ?? []) as Profile[]).map((d) => [d.id, d.nombre_completo]));

      notasAlumno = notasList
        .filter((n) => !materiaId || sesionPorId.get(n.sesion_id)?.materia_id === materiaId)
        .map((n) => {
          const sesion = sesionPorId.get(n.sesion_id);
          return {
            fecha: sesion?.fecha ?? "",
            materiaNombre: sesion ? (materiaNombrePorId.get(sesion.materia_id) ?? "Materia") : "Materia",
            docenteNombre: docenteNombrePorId.get(n.creado_por) ?? "Docente",
            nota: n.nota,
          };
        })
        .sort((a, b) => b.fecha.localeCompare(a.fecha));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Asistencia</h1>
        <p className="text-muted text-sm">
          {materiaSeleccionada
            ? `Cumplimiento de asistencia en ${materiaSeleccionada.nombre}, registrado por el docente`
            : "Cumplimiento de asistencia a clases por alumno, sumando todas las materias"}
        </p>
      </div>

      {materiasList.length > 0 && (
        <MateriaSelector
          materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
          seleccionada={materiaId}
          basePath="/portal/asistencia-academica"
          placeholder="Todas las materias"
        />
      )}

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
                    <td className="px-5 py-3 font-medium">
                      <Link href={hrefAlumno(a.id)} className={`hover:underline ${a.id === alumnoId ? "text-jom-pink" : ""}`}>
                        {a.nombre_completo}
                      </Link>
                    </td>
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

      {alumnoSeleccionado && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold">
            Notas de clase de {alumnoSeleccionado.nombre_completo}
            {materiaSeleccionada && ` · ${materiaSeleccionada.nombre}`}
          </p>
          {notasAlumno.length === 0 ? (
            <p className="text-muted text-sm">No hay notas registradas para este alumno{materiaSeleccionada ? " en esta materia" : ""}.</p>
          ) : (
            <div className="glass flex flex-col gap-3 rounded-2xl p-5">
              {notasAlumno.map((n, i) => (
                <div key={i} className="flex flex-col gap-1 border-b border-black/5 pb-3 last:border-0 last:pb-0 dark:border-white/5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium capitalize">{formatFecha(n.fecha)}</span>
                    <span className="rounded-full bg-jom-yellow/40 px-2 py-0.5 text-xs font-medium text-jom-ink">{n.materiaNombre}</span>
                    <span className="text-muted text-xs">· {n.docenteNombre}</span>
                  </div>
                  <p className="text-sm">{n.nota}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
