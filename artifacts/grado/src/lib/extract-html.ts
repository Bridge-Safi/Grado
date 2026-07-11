/**
 * Extracts a complete HTML document from a markdown response and sanitizes it
 * so it can render correctly in a srcdoc iframe (no local file references).
 * If imageDataUrls is provided, replaces __USER_IMAGE_N__ placeholders.
 */
export function extractHtml(text: string, imageDataUrls?: string[]): string | null {
  let html: string | null = null;

  // 1. Fenced code blocks: ```html ... ``` — or any fence containing a full document
  //    (certains modèles utilisent ``` sans le mot "html")
  const fenceRe = /```[a-zA-Z]*[ \t]*\r?\n?([\s\S]*?)```/g;
  let fenceMatch: RegExpExecArray | null;
  while ((fenceMatch = fenceRe.exec(text)) !== null) {
    const candidate = fenceMatch[1].trim();
    if (/<!DOCTYPE/i.test(candidate) || /<html[\s>]/i.test(candidate)) {
      html = candidate;
      break;
    }
  }

  // 2. Bare HTML document fallback (avec ou sans DOCTYPE)
  if (!html) {
    const docMatch =
      text.match(/(<!DOCTYPE\s+html[\s\S]*<\/html>)/i) ||
      text.match(/(<html[\s\S]*<\/html>)/i);
    if (docMatch) {
      html = docMatch[1].trim();
    }
  }

  if (!html) return null;

  // 3. Replace __USER_IMAGE_N__ placeholders with actual data URLs
  if (imageDataUrls && imageDataUrls.length > 0) {
    imageDataUrls.forEach((dataUrl, idx) => {
      if (dataUrl) {
        const placeholder = `__USER_IMAGE_${idx + 1}__`;
        // Replace all occurrences (in src, url(), background-image, etc.)
        html = html!.split(placeholder).join(dataUrl);
      }
    });
  }

  // 4. Sanitize: remove local <link rel="stylesheet" href="..."> tags
  html = html.replace(
    /<link\b[^>]*\bhref\s*=\s*["'](?!https?:\/\/)([^"']+)["'][^>]*>/gi,
    "<!-- local stylesheet removed by Grado -->"
  );

  // 5. Sanitize: remove local <script src="..."> tags
  html = html.replace(
    /<script\b[^>]*\bsrc\s*=\s*["'](?!https?:\/\/)([^"']+)["'][^>]*><\/script>/gi,
    "<!-- local script removed by Grado -->"
  );

  // 6. Sanitize: fix remaining local <img src="..."> → use a stock placeholder
  //    (skip data: URIs and placeholders already replaced above)
  html = html.replace(
    /<img\b([^>]*)\bsrc\s*=\s*["'](?!https?:\/\/|data:)([^"']+)["']([^>]*)>/gi,
    (_, before, _src, after) =>
      `<img${before} src="https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/400/300"${after}>`
  );

  return html;
}

/**
 * Version tolérante pour l'aperçu en temps réel : accepte un document HTML
 * encore incomplet (bloc de code non fermé pendant le streaming).
 */
export function extractHtmlLoose(text: string, imageDataUrls?: string[]): string | null {
  const complete = extractHtml(text, imageDataUrls);
  if (complete) return complete;

  // Bloc de code non terminé (le modèle est en train d'écrire)
  const lastFence = text.lastIndexOf("```");
  if (lastFence >= 0) {
    const after = text.slice(lastFence + 3).replace(/^[a-zA-Z]*[ \t]*\r?\n?/, "");
    if (/<!DOCTYPE/i.test(after) || /<html[\s>]/i.test(after)) {
      return after;
    }
  }

  // Document nu encore incomplet
  const bare = text.match(/(<!DOCTYPE\s+html[\s\S]*|<html[\s>][\s\S]*)$/i);
  if (bare) return bare[1];

  return null;
}
