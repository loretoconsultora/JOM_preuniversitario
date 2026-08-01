export const MOTIVOS_PRECARGADOS = [
  "Ansiedad",
  "Depresión",
  "Ataques de Pánico",
  "Comportamiento Suicida",
  "Angustia",
  "Bullying",
  "Desorden Alimenticio",
  "Duelo",
  "Estrés",
  "Miedos y Fobias",
  "Baja Autoestima",
  "Dependencia Emocional",
  "Relaciones insanas",
  "Adicciones",
];

// Paleta variada (no solo rosa/amarillo de marca) para poder distinguir
// muchas etiquetas distintas de un vistazo.
const PALETA = [
  "#eca9ad", // jom-pink
  "#ead67c", // jom-yellow
  "#a8c8ec",
  "#b8e0c8",
  "#d9b8ec",
  "#f0c29a",
  "#9adbd0",
  "#e0a8b8",
  "#c9d18a",
  "#b0b8e0",
];

function hashTexto(texto: string) {
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorMotivo(nombre: string) {
  const base = PALETA[hashTexto(nombre) % PALETA.length];
  return {
    background: `color-mix(in srgb, ${base} 35%, white)`,
    border: `color-mix(in srgb, ${base} 60%, white)`,
  };
}
