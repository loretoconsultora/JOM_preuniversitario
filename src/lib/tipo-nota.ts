export type NotaKind = "general" | "sesion" | "evaluacion";

export const NOTA_KIND_LABEL: Record<NotaKind, string> = {
  general: "Nota general",
  sesion: "Nota de sesión",
  evaluacion: "Nota de evaluación",
};

export const NOTA_KIND_EMOJI: Record<NotaKind, string> = {
  general: "📝",
  sesion: "📅",
  evaluacion: "✨",
};

export const NOTA_KIND_CLASS: Record<NotaKind, string> = {
  general: "bg-black/5 text-jom-ink dark:bg-white/10 dark:text-jom-white",
  sesion: "bg-jom-pink/30 text-jom-ink",
  evaluacion: "bg-jom-yellow/40 text-jom-ink",
};
