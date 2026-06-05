/**
 * Extracts the first complete HTML document from a markdown-like string.
 * Looks for ```html ... ``` blocks containing <!DOCTYPE html> or <html.
 */
export function extractHtml(text: string): string | null {
  // Try fenced code block first: ```html ... ```
  const fencedMatch = text.match(/```html\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    const candidate = fencedMatch[1].trim();
    if (/<html/i.test(candidate) || /<!DOCTYPE/i.test(candidate)) {
      return candidate;
    }
  }

  // Fallback: bare HTML document in the text
  const docMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*<\/html>)/i);
  if (docMatch) {
    return docMatch[1].trim();
  }

  return null;
}
