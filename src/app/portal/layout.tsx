import Link from "next/link";
import { cookies } from "next/headers";
import { User } from "lucide-react";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { esDocenteAcotado } from "@/lib/materias-gestionables";
import type { NotificacionDocente, Role } from "@/types/database";
import { JomLogo } from "@/components/jom-logo";
import { PortalNav } from "@/components/portal-nav";
import { VistaSwitcher } from "@/components/vista-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";
import { NotificacionesBell } from "@/components/notificaciones-bell";

const ROLE_LABEL: Record<string, string> = {
  alumno: "Alumno",
  docente: "Docente",
  directora: "Directora",
  terapeuta: "Terapeuta",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const rolesEfectivos = Array.from(new Set([profile.role, ...(profile.roles ?? [])])) as Role[];
  const cookieStore = await cookies();
  const vistaCookie = cookieStore.get("vista_activa")?.value as Role | undefined;
  const vista = vistaCookie && rolesEfectivos.includes(vistaCookie) ? vistaCookie : profile.role;

  const supabase = await createClient();
  const acotado = vista === "docente" ? await esDocenteAcotado(supabase, profile.id) : false;

  const notificacionesIniciales: NotificacionDocente[] =
    vista === "docente"
      ? ((
          await supabase
            .from("notificaciones_docente")
            .select("*")
            .eq("docente_id", profile.id)
            .order("created_at", { ascending: false })
            .limit(20)
        ).data ?? [])
      : [];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="glass-strong mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <JomLogo className="h-9 w-auto shrink-0" />
            <div className="min-w-0 overflow-x-auto">
              <PortalNav role={vista} acotado={acotado} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {vista === "docente" && <NotificacionesBell notificacionesIniciales={notificacionesIniciales} />}
            {rolesEfectivos.length > 1 && <VistaSwitcher roles={rolesEfectivos} vistaActual={vista} />}
            <Link
              href="/portal/perfil"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="hidden text-right sm:block">
                <p className="whitespace-nowrap text-sm font-medium leading-tight">{profile.nombre_completo}</p>
                <p className="text-muted whitespace-nowrap text-xs leading-tight">{ROLE_LABEL[vista]}</p>
              </div>
              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar subido por el usuario, no un asset estático
                  <img src={profile.avatar_url} alt={profile.nombre_completo} className="h-full w-full object-cover" />
                ) : (
                  <div className="bg-jom-pink/30 flex h-full w-full items-center justify-center">
                    <User size={16} className="text-jom-ink/60" />
                  </div>
                )}
              </div>
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
