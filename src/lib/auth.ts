import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

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

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "docente" && profile.role !== "directora") {
    redirect("/portal");
  }
  return profile;
}

export async function requireDocente(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "docente") {
    redirect("/portal");
  }
  return profile;
}

export async function requireTerapeuta(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "terapeuta") {
    redirect("/portal");
  }
  return profile;
}

export async function requireDirectora(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "directora") {
    redirect("/portal");
  }
  return profile;
}

export async function requireTerapeutaODirectora(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "terapeuta" && profile.role !== "directora") {
    redirect("/portal");
  }
  return profile;
}
