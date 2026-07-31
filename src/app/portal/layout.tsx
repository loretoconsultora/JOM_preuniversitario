import { requireProfile } from "@/lib/auth";
import { JomLogo } from "@/components/jom-logo";
import { PortalNav } from "@/components/portal-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

const ROLE_LABEL: Record<string, string> = {
  alumno: "Alumno",
  docente: "Docente",
  directora: "Directora",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 px-4 pt-4 sm:px-6">
        <div className="glass-strong mx-auto flex max-w-5xl items-center justify-between rounded-2xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <JomLogo className="text-xl" />
            <PortalNav role={profile.role} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile.nombre_completo}</p>
              <p className="text-muted text-xs leading-tight">{ROLE_LABEL[profile.role]}</p>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
