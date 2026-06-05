/**
 * Extracts a complete HTML document from a markdown response and sanitizes it
 * so it can render correctly in a srcdoc iframe (no local file references).
 * If imageDataUrls is provided, replaces __USER_IMAGE_N__ placeholders.
 */
export function extractHtml(text: string, imageDataUrls?: string[]): string | null {
  let html: string | null = null;

  // 1. Fenced code block: ```html ... ```
  const fencedMatch = text.match(/```html\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    const candidate = fencedMatch[1].trim();
    if (/<html/i.test(candidate) || /<!DOCTYPE/i.test(candidate)) {
      html = candidate;
    }
  }

  // 2. Bare HTML document fallback
  if (!html) {
    const docMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*<\/html>)/i);
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
