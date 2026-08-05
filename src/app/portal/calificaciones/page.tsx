import Link from "next/link";
import { Plus, ClipboardCheck, GraduationCap, Users, UserRound } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { materiasGestionables } from "@/lib/materias-gestionables";
import { materiasInscritas, alumnosInscritos } from "@/lib/materias-inscritas";
import { desglosePorAlumnoYMateria, type DesgloseMateria } from "@/lib/desglose-calificaciones";
import { AlumnoSelector } from "@/components/alumno-selector";
import { MateriaSelector } from "@/components/materia-selector";
import type { Materia, Profile } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

function tabClass(activo: boolean) {
  return `inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    activo ? "bg-jom-ink text-jom-white dark:bg-jom-white dark:text-jom-ink" : "glass hover:opacity-80"
  }`;
}

async function renderDesgloseTabla(materiasParaMostrar: Materia[], alumnoId: string) {
  if (materiasParaMostrar.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
        Este alumno no está inscrito en ninguna materia todavía.
      </div>
    );
  }

  const desgloseMap = await desglosePorAlumnoYMateria(
    [alumnoId],
    materiasParaMostrar.map((m) => m.id)
  );
  const porMateria = desgloseMap.get(alumnoId) ?? new Map<string, DesgloseMateria>();

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
            <th className="px-5 py-3 font-medium">Materia</th>
            <th className="px-5 py-3 font-medium">Tareas</th>
            <th className="px-5 py-3 font-medium">Evaluaciones</th>
            <th className="px-5 py-3 font-medium">Asistencia</th>
            <th className="px-5 py-3 font-medium">Calificación final</th>
          </tr>
        </thead>
        <tbody>
          {materiasParaMostrar.map((m) => {
            const d = porMateria.get(m.id);
            return (
              <tr key={m.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                <td className="px-5 py-3">
                  <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                    {m.nombre}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {d && d.tareas.n > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ClipboardCheck size={12} className="text-muted shrink-0" />
                      {d.tareas.n} · {d.tareas.promedio}
                    </span>
                  ) : (
                    <span className="text-muted">Sin datos</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {d && d.evaluaciones.n > 0 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap size={12} className="text-muted shrink-0" />
                      {d.evaluaciones.n} · {d.evaluaciones.promedio}
                    </span>
                  ) : (
                    <span className="text-muted">Sin datos</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {d && d.asistencia.total > 0 ? (
                    `${d.asistencia.porcentaje}% (${d.asistencia.presentes}/${d.asistencia.total})`
                  ) : (
                    <span className="text-muted">Sin registrar</span>
                  )}
                </td>
                <td className="px-5 py-3 font-semibold">{d?.final ?? "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

async function renderPorAlumno(supabase: Supabase, materiasList: Materia[], alumnoParam?: string) {
  const { data: alumnos } = await supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo");
  const alumnosList = (alumnos ?? []) as Profile[];
  const alumnoId = alumnoParam && alumnosList.some((a) => a.id === alumnoParam) ? alumnoParam : "";

  let contenido = (
    <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Elige un alumno para ver su desglose.</div>
  );
  if (alumnoId) {
    const inscritas = await materiasInscritas(supabase, alumnoId);
    const materiaIdsAccesibles = new Set(materiasList.map((m) => m.id));
    const materiasDelAlumno = inscritas.filter((m) => materiaIdsAccesibles.has(m.id));
    contenido = await renderDesgloseTabla(materiasDelAlumno, alumnoId);
  }

  return (
    <div className="flex flex-col gap-4">
      <AlumnoSelector
        alumnos={alumnosList.map((a) => ({ id: a.id, nombre: a.nombre_completo }))}
        seleccionado={alumnoId}
        basePath="/portal/calificaciones?vista=alumno"
      />
      {contenido}
    </div>
  );
}

async function renderPorMateria(supabase: Supabase, materiasList: Materia[], materiaParam?: string) {
  const materiaId = materiaParam && materiasList.some((m) => m.id === materiaParam) ? materiaParam : "";

  let contenido = (
    <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
      Elige una materia para ver las calificaciones finales.
    </div>
  );
  if (materiaId) {
    const alumnos = await alumnosInscritos(supabase, materiaId);
    if (alumnos.length === 0) {
      contenido = (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          No hay alumnos inscritos en esta materia todavía.
        </div>
      );
    } else {
      const desgloseMap = await desglosePorAlumnoYMateria(
        alumnos.map((a) => a.id),
        [materiaId]
      );
      contenido = (
        <div className="glass overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
                <th className="px-5 py-3 font-medium">Alumno</th>
                <th className="px-5 py-3 font-medium">Calificación final</th>
              </tr>
            </thead>
            <tbody>
              {alumnos.map((a) => {
                const final = desgloseMap.get(a.id)?.get(materiaId)?.final ?? null;
                return (
                  <tr key={a.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                    <td className="px-5 py-3 font-medium">{a.nombre_completo}</td>
                    <td className="px-5 py-3 font-semibold">{final ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <MateriaSelector
        materias={materiasList.map((m) => ({ id: m.id, nombre: m.nombre }))}
        seleccionada={materiaId}
        basePath="/portal/calificaciones?vista=materia"
        placeholder="Selecciona una materia"
      />
      {contenido}
    </div>
  );
}

async function renderVistaAlumno(supabase: Supabase, profile: Profile, materiaParam?: string) {
  const materiasList = await materiasInscritas(supabase, profile.id);
  const materiaValida = materiaParam && materiasList.some((m) => m.id === materiaParam);

  if (materiaValida) {
    const materia = materiasList.find((m) => m.id === materiaParam)!;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/portal/calificaciones" className="text-muted inline-flex items-center gap-1.5 text-sm hover:text-fg">
            ← Todas mis materias
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{materia.nombre}</h1>
          <p className="text-muted text-sm">
            Tareas 60% + evaluaciones 30% + asistencia 10% — lo que aún no tenga datos no cuenta en contra, su peso
            se reparte entre lo demás.
          </p>
        </div>
        {await renderDesgloseTabla([materia], profile.id)}
      </div>
    );
  }

  if (materiasList.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Calificaciones</h1>
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Todavía no tienes calificaciones registradas.
        </div>
      </div>
    );
  }

  const desgloseMap = await desglosePorAlumnoYMateria(
    [profile.id],
    materiasList.map((m) => m.id)
  );
  const porMateria = desgloseMap.get(profile.id) ?? new Map<string, DesgloseMateria>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Calificaciones</h1>
        <p className="text-muted text-sm">Toca una materia para ver el desglose de tu calificación final.</p>
      </div>
      <div className="glass overflow-hidden rounded-2xl">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5 text-xs uppercase text-muted dark:border-white/10">
              <th className="px-5 py-3 font-medium">Materia</th>
              <th className="px-5 py-3 font-medium">Calificación final</th>
            </tr>
          </thead>
          <tbody>
            {materiasList.map((m) => {
              const final = porMateria.get(m.id)?.final ?? null;
              return (
                <tr key={m.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                  <td className="px-5 py-3">
                    <Link href={`/portal/calificaciones?materia=${m.id}`} className="hover:underline">
                      <span className="inline-block rounded-full bg-jom-yellow/40 px-2.5 py-0.5 text-xs font-medium text-jom-ink">
                        {m.nombre}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-semibold">
                    <Link href={`/portal/calificaciones?materia=${m.id}`} className="hover:underline">
                      {final ?? "—"}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function CalificacionesPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string; alumno?: string; materia?: string }>;
}) {
  const profile = await requireProfile();
  const { vista: vistaParam, alumno: alumnoParam, materia: materiaParam } = await searchParams;
  const supabase = await createClient();
  const isDocente = profile.role === "docente";

  if (profile.role === "alumno") {
    return renderVistaAlumno(supabase, profile, materiaParam);
  }

  const materiasList = isDocente
    ? await materiasGestionables(supabase, profile.id)
    : (((await supabase.from("materias").select("*").order("nombre")).data ?? []) as Materia[]);

  const vista = vistaParam === "materia" ? "materia" : "alumno";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calificaciones</h1>
          <p className="text-muted text-sm">
            Tareas 60% + evaluaciones 30% + asistencia 10% — lo que aún no tenga datos no cuenta en contra.
          </p>
        </div>
        {isDocente && (
          <Link
            href="/portal/calificaciones/nueva"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nueva calificación
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link href="/portal/calificaciones?vista=alumno" className={tabClass(vista === "alumno")}>
          <UserRound size={14} /> Por alumno
        </Link>
        <Link href="/portal/calificaciones?vista=materia" className={tabClass(vista === "materia")}>
          <Users size={14} /> Por materia
        </Link>
      </div>

      {vista === "alumno"
        ? await renderPorAlumno(supabase, materiasList, alumnoParam)
        : await renderPorMateria(supabase, materiasList, materiaParam)}
    </div>
  );
}
