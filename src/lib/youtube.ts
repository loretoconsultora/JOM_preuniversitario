/** Convierte cualquier link de YouTube (watch, youtu.be, shorts, embed) a su URL de embed. */
export function toYoutubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    let id: string | null = null;

    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.slice(1);
    } else if (parsed.hostname.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        id = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/embed/")) {
        id = parsed.pathname.replace("/embed/", "");
      } else if (parsed.pathname.startsWith("/shorts/")) {
        id = parsed.pathname.replace("/shorts/", "");
      }
    }

    if (!id) return null;
    id = id.split("&")[0].split("?")[0];
    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}
