import Link from "next/link";
import { Plus, KeyRound, GraduationCap } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Materia, Profile } from "@/types/database";
import { DocenteMateriasEditor } from "@/components/docente-materias-editor";

export default async function DocentesPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo_correo?: string; nueva_password?: string }>;
}) {
  const profile = await requireStaff();
  const { nuevo_correo, nueva_password } = await searchParams;
  const supabase = await createClient();

  const [{ data: docentes }, { data: materias }, { data: asignaciones }] = await Promise.all([
    supabase.from("profiles").select("*").eq("role", "docente").order("nombre_completo"),
    supabase.from("materias").select("*").order("nombre"),
    supabase.from("materia_docentes").select("materia_id, docente_id"),
  ]);
  const docentesList = (docentes ?? []) as Profile[];
  const materiasList = (materias ?? []) as Materia[];
  const asignacionesPorDocente = new Map<string, string[]>();
  for (const a of (asignaciones ?? []) as { materia_id: string; docente_id: string }[]) {
    const lista = asignacionesPorDocente.get(a.docente_id) ?? [];
    lista.push(a.materia_id);
    asignacionesPorDocente.set(a.docente_id, lista);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Docentes</h1>
          <p className="text-muted text-sm">{docentesList.length} cuentas de docente registradas</p>
        </div>
        {profile.role === "docente" && (
          <Link
            href="/portal/docentes/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo docente
          </Link>
        )}
      </div>

      {nuevo_correo && nueva_password && (
        <div className="glass-strong flex items-start gap-3 rounded-2xl border border-jom-yellow p-5">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-jom-ink dark:text-jom-yellow" />
          <div className="text-sm">
            <p className="font-semibold">Cuenta creada. Comparte estos accesos con el docente:</p>
            <p className="mt-1">
              Correo: <span className="font-mono">{nuevo_correo}</span>
              <br />
              Contraseña temporal: <span className="font-mono">{nueva_password}</span>
            </p>
            <p className="text-muted mt-1 text-xs">
              Esta contraseña solo se muestra una vez. Pide al docente que la cambie desde su correo si lo prefieres.
            </p>
          </div>
        </div>
      )}

      <p className="glass rounded-2xl p-4 text-xs text-muted">
        Un docente sin materias asignadas tiene acceso completo a la plataforma (temario, tareas, exámenes y
        recursos de todas las materias). Si le asignas una o más materias, queda acotado solo a esas.
      </p>

      {docentesList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">Aún no hay docentes registrados.</div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {docentesList.map((docente, i) => (
            <div
              key={docente.id}
              className={`flex flex-col gap-2 px-5 py-4 ${
                i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap size={16} className="text-muted shrink-0" />
                <span className="font-medium">
                  {docente.nombre_completo}
                  {docente.id === profile.id && <span className="text-muted font-normal"> (tú)</span>}
                </span>
              </div>
              <DocenteMateriasEditor
                docenteId={docente.id}
                materias={materiasList}
                asignadasIniciales={asignacionesPorDocente.get(docente.id) ?? []}
                editable={profile.role === "docente"}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
