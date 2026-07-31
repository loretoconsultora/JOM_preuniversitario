import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"];

export function sanitizeRichText(html: string): string {
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
  }).trim();

  const isEmpty = sanitizeHtml(clean, { allowedTags: [], allowedAttributes: {} }).trim().length === 0;
  return isEmpty ? "" : clean;
}
