"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, User } from "lucide-react";
import type { Profile } from "@/types/database";
import { actualizarNombre, subirAvatar } from "@/app/portal/perfil/actions";

const ROLE_LABEL: Record<string, string> = {
  alumno: "Alumno",
  docente: "Docente",
  directora: "Directora",
};

export function PerfilForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(profile.nombre_completo);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardarNombre() {
    setError(null);
    setGuardandoNombre(true);
    try {
      await actualizarNombre(nombre);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el nombre.");
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function onFotoSeleccionada(file: File) {
    setError(null);
    setSubiendoFoto(true);
    const preview = URL.createObjectURL(file);
    setAvatarUrl(preview);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await subirAvatar(formData);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo subir la foto.");
      setAvatarUrl(profile.avatar_url);
    } finally {
      setSubiendoFoto(false);
    }
  }

  const inputClass =
    "glass rounded-xl px-4 py-2.5 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-jom-pink";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendoFoto}
          aria-label="Cambiar foto de perfil"
          className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-full disabled:opacity-70"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatares son fotos subidas por el usuario, no assets estáticos optimizables
            <img src={avatarUrl} alt={profile.nombre_completo} className="h-full w-full object-cover" />
          ) : (
            <div className="bg-jom-pink/30 flex h-full w-full items-center justify-center">
              <User size={32} className="text-jom-ink/60" />
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFotoSeleccionada(file);
            e.target.value = "";
          }}
        />
        <p className="text-muted text-xs">{subiendoFoto ? "Subiendo foto…" : "Toca la foto para cambiarla"}</p>
      </div>

      <label className="flex flex-col gap-1.5 text-sm">
        Nombre completo
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        Rol
        <input value={ROLE_LABEL[profile.role] ?? profile.role} disabled className={`${inputClass} opacity-60`} />
      </label>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        type="button"
        onClick={guardarNombre}
        disabled={guardandoNombre || nombre.trim() === profile.nombre_completo}
        className="self-start rounded-full bg-jom-ink px-6 py-2.5 text-sm font-semibold text-jom-white transition-opacity hover:opacity-90 disabled:opacity-60 dark:bg-jom-white dark:text-jom-ink"
      >
        {guardandoNombre ? "Guardando…" : "Guardar nombre"}
      </button>
    </div>
  );
}
