import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireProfile, tieneRol } from "@/lib/auth";
import type { Role } from "@/types/database";

export default async function PortalHome() {
  const profile = await requireProfile();

  const cookieStore = await cookies();
  const vistaCookie = cookieStore.get("vista_activa")?.value as Role | undefined;
  const vista = vistaCookie && tieneRol(profile, vistaCookie) ? vistaCookie : profile.role;

  redirect(vista === "terapeuta" ? "/portal/pacientes" : "/portal/tareas");
}
