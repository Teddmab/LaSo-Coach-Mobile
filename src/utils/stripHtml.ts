/**
 * Retire les balises HTML (ex. <div>, <p>) et convertit le texte en texte brut lisible dans l’app.
 */
export function stripHtmlToPlainText(input: string | undefined | null): string {
  if (input == null || typeof input !== 'string') {
    return '';
  }
  let s = input;

  s = s.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  s = s.replace(/<\/p>/gi, '\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/div>/gi, '\n');
  s = s.replace(/<\/h[1-6]>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');

  s = s.replace(/&nbsp;/gi, ' ');
  s = s.replace(/&#(\d+);/g, (_, n: string) => {
    const c = parseInt(n, 10);
    return Number.isFinite(c) && c > 0 ? String.fromCharCode(c) : _;
  });
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => {
    const c = parseInt(h, 16);
    return Number.isFinite(c) && c > 0 ? String.fromCharCode(c) : _;
  });
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&apos;/g, "'");
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&amp;/g, '&');

  s = s.replace(/[ \t\f\v]+/g, ' ');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}
