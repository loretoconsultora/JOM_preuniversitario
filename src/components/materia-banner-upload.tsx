"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { subirBannerMateria } from "@/app/portal/temario/actions";

export function MateriaBannerUpload({ materiaId }: { materiaId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);

  async function onFotoSeleccionada(file: File) {
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("banner", file);
      await subirBannerMateria(materiaId, formData);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "No se pudo subir el banner.");
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          fileInputRef.current?.click();
        }}
        disabled={subiendo}
        aria-label="Cambiar banner de la materia"
        className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-opacity hover:opacity-80 disabled:opacity-60"
      >
        <Camera size={14} />
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
    </>
  );
}
