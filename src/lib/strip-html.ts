export function stripHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Convierte texto plano (ej. un textarea) a HTML seguro para guardarlo en
// una columna que luego se renderiza con dangerouslySetInnerHTML.
export function textoPlanoAHtml(texto: string) {
  const escapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<p>${escapado.replace(/\n/g, "<br>")}</p>`;
}
