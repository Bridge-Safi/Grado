export interface MediaTag {
  type: "music" | "video";
  prompt: string;
  title?: string;
  genre?: string;
  lyrics?: string;
}

export function extractMediaTag(content: string): MediaTag | null {
  // New rich format: [GRADO_MUSIC: prompt="..." | title="..." | genre="..." | lyrics="..."]
  const richMusicMatch = content.match(/\[GRADO_MUSIC:\s*([\s\S]+?)\]/);
  if (richMusicMatch) {
    const raw = richMusicMatch[1];
    const get = (key: string) => {
      const m = raw.match(new RegExp(`${key}="((?:[^"\\\\]|\\\\.)*)"`));
      return m ? m[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : undefined;
    };
    const prompt = get("prompt") ?? raw.trim();
    return {
      type: "music",
      prompt,
      title: get("title"),
      genre: get("genre"),
      lyrics: get("lyrics"),
    };
  }

  const videoMatch = content.match(/\[GRADO_VIDEO:\s*(.+?)\]/s);
  if (videoMatch) {
    return { type: "video", prompt: videoMatch[1].trim() };
  }
  return null;
}

export function stripMediaTag(content: string): string {
  return content
    .replace(/\[GRADO_MUSIC:\s*[\s\S]+?\]/g, "")
    .replace(/\[GRADO_VIDEO:\s*.+?\]/s, "")
    .trim();
}
