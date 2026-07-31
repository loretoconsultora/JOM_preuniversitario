import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { RECURSOS_BUCKET } from "@/lib/storage";
import type { Recurso } from "@/types/database";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: recurso } = await supabase.from("recursos").select("*").eq("id", id).single();
  if (!recurso) {
    return NextResponse.redirect(new URL("/portal/recursos", request.url));
  }
  const recursoData = recurso as Recurso;

  if (profile.role === "alumno") {
    // Se ignora el error si ya existía (unique constraint) — solo importa
    // que quede registrada la primera vez que lo abre.
    await supabase.from("recurso_vistas").insert({ recurso_id: id, alumno_id: profile.id });
  }

  if (recursoData.tipo === "enlace" && recursoData.url) {
    return NextResponse.redirect(recursoData.url);
  }

  if (recursoData.tipo === "archivo" && recursoData.storage_path) {
    const { data: signed } = await supabase.storage
      .from(RECURSOS_BUCKET)
      .createSignedUrl(recursoData.storage_path, 3600);
    if (signed?.signedUrl) {
      return NextResponse.redirect(signed.signedUrl);
    }
  }

  return NextResponse.redirect(new URL("/portal/recursos", request.url));
}
