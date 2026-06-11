export function extractImageSources(html: string): string[] {
  const sources = new Set<string>();
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    sources.add(match[1]);
  }
  return Array.from(sources);
}

export async function checkBrokenImages(
  sources: string[]
): Promise<Array<{ src: string; reason: string }>> {
  const broken: Array<{ src: string; reason: string }> = [];

  await Promise.all(
    sources.map(async (src) => {
      if (src.startsWith("data:") || src.startsWith("cid:")) return;

      if (src.startsWith("/")) {
        broken.push({ src, reason: "Relative path — use absolute URL for email" });
        return;
      }

      try {
        const response = await fetch(src, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
          broken.push({ src, reason: `HTTP ${response.status}` });
        }
      } catch {
        broken.push({ src, reason: "Failed to load" });
      }
    })
  );

  return broken;
}
