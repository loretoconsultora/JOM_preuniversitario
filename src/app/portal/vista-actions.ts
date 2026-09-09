"use server";

import { cookies } from "next/headers";
import { requireProfile, tieneRol } from "@/lib/auth";
import { actionError, actionOk, ERROR_INESPERADO, type ActionResult } from "@/lib/action-result";
import type { Role } from "@/types/database";

export async function setVistaActiva(vista: Role): Promise<ActionResult> {
  const profile = await requireProfile();
  if (!tieneRol(profile, vista)) return actionError("No tienes ese rol.");

  try {
    const store = await cookies();
    store.set("vista_activa", vista, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return actionOk({});
  } catch (e) {
    console.error("setVistaActiva:", e);
    return actionError(e instanceof Error ? e.message : ERROR_INESPERADO);
  }
}
