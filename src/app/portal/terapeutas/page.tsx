import Link from "next/link";
import { Plus, KeyRound, HeartHandshake } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function TerapeutasPage({
  searchParams,
}: {
  searchParams: Promise<{ nuevo_correo?: string; nueva_password?: string }>;
}) {
  const profile = await requireStaff();
  const { nuevo_correo, nueva_password } = await searchParams;
  const supabase = await createClient();

  const { data: terapeutas } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "terapeuta")
    .order("nombre_completo");
  const terapeutasList = (terapeutas ?? []) as Profile[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Terapeutas</h1>
          <p className="text-muted text-sm">{terapeutasList.length} cuentas de terapeuta registradas</p>
        </div>
        {profile.role === "docente" && (
          <Link
            href="/portal/terapeutas/nuevo"
            className="inline-flex items-center gap-1.5 rounded-full bg-jom-ink px-4 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 dark:bg-jom-white dark:text-jom-ink"
          >
            <Plus size={15} /> Nuevo terapeuta
          </Link>
        )}
      </div>

      {nuevo_correo && nueva_password && (
        <div className="glass-strong flex items-start gap-3 rounded-2xl border border-jom-yellow p-5">
          <KeyRound size={18} className="mt-0.5 shrink-0 text-jom-ink dark:text-jom-yellow" />
          <div className="text-sm">
            <p className="font-semibold">Cuenta creada. Comparte estos accesos con el terapeuta:</p>
            <p className="mt-1">
              Correo: <span className="font-mono">{nuevo_correo}</span>
              <br />
              Contraseña temporal: <span className="font-mono">{nueva_password}</span>
            </p>
            <p className="text-muted mt-1 text-xs">
              Esta contraseña solo se muestra una vez. Pide al terapeuta que la cambie desde su correo si lo prefieres.
            </p>
          </div>
        </div>
      )}

      <p className="glass rounded-2xl p-4 text-xs text-muted">
        Por confidencialidad, los pacientes, notas y evaluaciones de cada terapeuta son privados: aquí solo se
        administran las cuentas de acceso.
      </p>

      {terapeutasList.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center text-sm text-muted">
          Aún no hay terapeutas registrados.
        </div>
      ) : (
        <div className="glass overflow-hidden rounded-2xl">
          {terapeutasList.map((terapeuta, i) => (
            <div
              key={terapeuta.id}
              className={`flex items-center gap-3 px-5 py-4 ${
                i !== 0 ? "border-t border-black/5 dark:border-white/5" : ""
              }`}
            >
              <HeartHandshake size={16} className="text-muted shrink-0" />
              <span className="font-medium">{terapeuta.nombre_completo}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
