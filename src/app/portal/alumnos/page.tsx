import Link from "next/link";
import { Plus, ChevronRight, KeyRound } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Calificacion, Profile } from "@/types/database";

export default async function AlumnosPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo_correo?: string; nueva_password?: string }>;
}) {
  const profile = await requireStaff();
  const { nuevo_correo, nueva_password } = await searchParams;
  const supabase = await createClient();

  const [{ data: alumnos }, { data: calificaciones }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "alumno").order("nombre_completo"),
    supabase.from("calificaciones").select("*"),
  ]);

  const alumnosList = (alumnos ?? []) as Profile[];
  const calificacionesList = (calificaciones ?? []) as Calificacion[];

  const promedioPorAlumno = new Map<string, number>();
  for (const alumno of alumnosList) {
    const notas = calificacionesList
      .filter((c) => c.alumno_id === alumno.id && c.calificacion !== null)
      .map((c) => c.calificacion as number);
    if (notas.length > 0) {
      promedioPorAlumno.set(alumno.id, notas.reduce((a, b) => a + b, 0) / notas.length);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Alumnos</h1>
          <p className="text-muted text-sm">{alumnosList.length} alumnos registrados</p>
        </div>
        {profile.role === "docente" && (
          <Link
            href="/portal/alumnos/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo alumno
          </Link>
        )}
      </div>

      {nuevo_correo && nueva_password && (
        <div className="glass-strong flex items-start gap-3 rounded-2xl border border-jom-yellow p-5">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-jom-ink dark:text-jom-yellow" />
          <div className="text-sm">
            <p className="font-semibold">Cuenta creada. Comparte estos accesos con el alumno:</p>
            <p className="mt-1">
              Correo: <span className="font-mono">{nuevo_correo}</span>
              <br />
              Contraseña temporal: <span className="font-mono">{nueva_password}</span>
            </p>
            <p className="text-muted mt-1 text-xs">
              Esta contraseña solo se muestra una vez. Pide al alumno que la cambie desde su correo si lo prefieres.
            </p>
          </div>
        </div>
      )}

      {alumnosList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Aún no hay alumnos registrados.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {alumnosList.map((alumno, i) => {
            const promedio = promedioPorAlumno.get(alumno.id);
            return (
              <Link
                key={alumno.id}
                href={`/portal/alumnos/${alumno.id}`}
                className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                  i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
                }`}
              >
                <span className="font-medium">{alumno.nombre_completo}</span>
                <div className="flex items-center gap-3">
                  {promedio !== undefined && (
                    <span className="rounded-full bg-jom-pink/30 px-2.5 py-0.5 text-xs font-medium text-jom-ink dark:text-jom-white">
                      Promedio {promedio.toFixed(1)}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
