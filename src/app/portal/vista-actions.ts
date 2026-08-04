"use server";

import { cookies } from "next/headers";
import { requireProfile, tieneRol } from "@/lib/auth";
import type { Role } from "@/types/database";

export async function setVistaActiva(vista: Role) {
  const profile = await requireProfile();
  if (!tieneRol(profile, vista)) throw new Error("No tienes ese rol.");

  const store = await cookies();
  store.set("vista_activa", vista, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}
