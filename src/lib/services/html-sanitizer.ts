const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB

export function validateHtmlFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith(".html")) {
    return "Only .html files are supported";
  }
  if (file.size > MAX_HTML_SIZE) {
    return "HTML file must be smaller than 5MB";
  }
  return null;
}

export function sanitizeHtmlForPreview(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "");
}

export function wrapHtmlForPreview(html: string): string {
  const sanitized = sanitizeHtmlForPreview(html);
  if (/<html[\s>]/i.test(sanitized)) {
    return sanitized;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${sanitized}</body></html>`;
}
