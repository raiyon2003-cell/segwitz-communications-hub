import {
  findRelativeAssetPaths,
  rewriteRelativeAssetUrls,
} from "@/lib/services/html-sanitizer";
import { uploadFile, STORAGE_BUCKETS } from "@/lib/services/storage";

const IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]);

export async function processHtmlAssetFiles(
  html: string,
  assetFiles: File[],
  ownerId: string
): Promise<string> {
  if (assetFiles.length === 0) return html;

  const relativePaths = findRelativeAssetPaths(html);
  if (relativePaths.length === 0) return html;

  const urlMap: Record<string, string> = {};

  for (const file of assetFiles) {
    if (!IMAGE_TYPES.has(file.type) && !file.name.match(/\.(png|jpe?g|gif|webp|svg)$/i)) {
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const normalizedName = file.name.replace(/^.*[/\\]/, "");
    const path = `${ownerId}/assets/${Date.now()}-${normalizedName}`;
    const publicUrl = await uploadFile(
      STORAGE_BUCKETS.ASSETS,
      path,
      buffer,
      file.type || "application/octet-stream"
    );

    for (const relativePath of relativePaths) {
      if (
        relativePath === file.name ||
        relativePath.endsWith(`/${normalizedName}`) ||
        relativePath.endsWith(normalizedName)
      ) {
        urlMap[relativePath] = publicUrl;
      }
    }

    urlMap[`assets/${normalizedName}`] = publicUrl;
    urlMap[normalizedName] = publicUrl;
  }

  return rewriteRelativeAssetUrls(html, urlMap);
}
