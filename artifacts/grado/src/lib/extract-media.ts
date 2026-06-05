export interface MediaTag {
  type: "music" | "video";
  prompt: string;
}

export function extractMediaTag(content: string): MediaTag | null {
  const musicMatch = content.match(/\[GRADO_MUSIC:\s*(.+?)\]/s);
  if (musicMatch) {
    return { type: "music", prompt: musicMatch[1].trim() };
  }
  const videoMatch = content.match(/\[GRADO_VIDEO:\s*(.+?)\]/s);
  if (videoMatch) {
    return { type: "video", prompt: videoMatch[1].trim() };
  }
  return null;
}

export function stripMediaTag(content: string): string {
  return content
    .replace(/\[GRADO_MUSIC:\s*.+?\]/s, "")
    .replace(/\[GRADO_VIDEO:\s*.+?\]/s, "")
    .trim();
}
