const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB

const RELATIVE_ASSET_REGEX =
  /(?:src|href|background)=["'](?!https?:|data:|cid:|\/\/)([^"']+)["']/gi;

export function findRelativeAssetPaths(html: string): string[] {
  const paths = new Set<string>();
  let match: RegExpExecArray | null;
  const regex = new RegExp(RELATIVE_ASSET_REGEX.source, "gi");
  while ((match = regex.exec(html)) !== null) {
    paths.add(match[1]);
  }
  return Array.from(paths);
}

export function rewriteRelativeAssetUrls(
  html: string,
  urlMap: Record<string, string>
): string {
  let result = html;
  const entries = Object.entries(urlMap).sort(
    (a, b) => b[0].length - a[0].length
  );
  for (const [relativePath, absoluteUrl] of entries) {
    result = result.split(relativePath).join(absoluteUrl);
  }
  return result;
}

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

export function resolveRelativeUrls(html: string, baseUrl?: string | null): string {
  if (!baseUrl?.trim()) return html;

  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return html;
  }

  const baseDir = base.href.replace(/[^/]+$/, "");

  return html.replace(
    /((?:src|href|background)=["'])(?!https?:|data:|cid:|\/\/|#)([^"']+)(["'])/gi,
    (_, prefix: string, path: string, suffix: string) => {
      try {
        const resolved = new URL(path, baseDir).href;
        return `${prefix}${resolved}${suffix}`;
      } catch {
        return `${prefix}${path}${suffix}`;
      }
    }
  );
}

export function wrapHtmlForPreview(
  html: string,
  baseUrl?: string | null
): string {
  const sanitized = sanitizeHtmlForPreview(html);
  const resolved = resolveRelativeUrls(sanitized, baseUrl);
  if (/<html[\s>]/i.test(resolved)) {
    return resolved;
  }
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${resolved}</body></html>`;
}
