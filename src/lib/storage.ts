export const TAREAS_BUCKET = "tareas-adjuntos";
export const RECURSOS_BUCKET = "recursos-adjuntos";
export const TEMARIO_BUCKET = "temario-adjuntos";
export const AVATARES_BUCKET = "avatares";
export const MATERIA_BANNERS_BUCKET = "materia-banners";

export function formatBytes(bytes: number | null) {
  if (!bytes) return "";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
