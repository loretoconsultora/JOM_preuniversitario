"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";

export function TemaEditLink({ temaId }: { temaId: string }) {
  return (
    <Link
      href={`/portal/temario/${temaId}/editar`}
      aria-label="Editar tema"
      onClick={(e) => e.stopPropagation()}
      className="text-muted rounded-full p-1.5 transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
    >
      <Pencil size={15} />
    </Link>
  );
}
