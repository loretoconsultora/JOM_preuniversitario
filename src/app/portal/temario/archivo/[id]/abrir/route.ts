import { NextResponse, type NextRequest } from "next/server";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TEMARIO_BUCKET } from "@/lib/storage";
import type { TemaArchivo } from "@/types/database";

// Mismo patrón que /portal/recursos/[id]/abrir: registra la vista (para medir
// avance real del alumno) y redirige a una URL firmada fresca, para no
// depender de una firmada de hace rato que ya pudo haber expirado.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: archivo } = await supabase.from("tema_archivos").select("*").eq("id", id).single();
  if (!archivo) {
    return NextResponse.redirect(new URL("/portal/temario", request.url));
  }
  const archivoData = archivo as TemaArchivo;

  if (profile.role === "alumno") {
    // Se ignora el error si ya existía (unique constraint) — solo importa
    // que quede registrada la primera vez que lo abre.
    await supabase.from("tema_archivo_vistas").insert({ archivo_id: id, alumno_id: profile.id });
  }

  const { data: signed } = await supabase.storage
    .from(TEMARIO_BUCKET)
    .createSignedUrl(archivoData.storage_path, 3600);
  if (signed?.signedUrl) {
    return NextResponse.redirect(signed.signedUrl);
  }

  return NextResponse.redirect(new URL("/portal/temario", request.url));
}
