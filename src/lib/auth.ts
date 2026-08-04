import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/types/database";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
}

// profile.roles guarda roles EXTRA además de profile.role (ej. alguien
// docente y terapeuta a la vez). Se defiende contra roles undefined por si
// el código ya se desplegó pero la migración que agrega la columna todavía
// no corre en la base de datos.
export function tieneRol(profile: Profile, rol: Role) {
  return profile.role === rol || (profile.roles ?? []).includes(rol);
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (!tieneRol(profile, "docente") && !tieneRol(profile, "directora")) {
    redirect("/portal");
  }
  return profile;
}

export async function requireDocente(): Promise<Profile> {
  const profile = await requireProfile();
  if (!tieneRol(profile, "docente")) {
    redirect("/portal");
  }
  return profile;
}

export async function requireTerapeuta(): Promise<Profile> {
  const profile = await requireProfile();
  if (!tieneRol(profile, "terapeuta")) {
    redirect("/portal");
  }
  return profile;
}

export async function requireDirectora(): Promise<Profile> {
  const profile = await requireProfile();
  if (!tieneRol(profile, "directora")) {
    redirect("/portal");
  }
  return profile;
}

export async function requireTerapeutaODirectora(): Promise<Profile> {
  const profile = await requireProfile();
  if (!tieneRol(profile, "terapeuta") && !tieneRol(profile, "directora")) {
    redirect("/portal");
  }
  return profile;
}
