import { requireProfile } from "@/lib/auth";
import { PerfilForm } from "@/components/perfil-form";

export default async function PerfilPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mi perfil</h1>
        <p className="text-muted text-sm">Tu nombre y foto se ven en el navbar del portal</p>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <PerfilForm profile={profile} />
      </div>
    </div>
  );
}
