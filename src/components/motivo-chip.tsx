import { colorMotivo } from "@/lib/motivo-tags";

export function MotivoChip({ nombre }: { nombre: string }) {
  const { background, border } = colorMotivo(nombre);
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ background, borderColor: border, color: "var(--color-jom-ink)" }}
    >
      {nombre}
    </span>
  );
}
