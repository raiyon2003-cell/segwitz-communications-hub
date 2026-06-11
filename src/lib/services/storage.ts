import { createAdminClient } from "@/lib/supabase/admin";

export const STORAGE_BUCKETS = {
  TEMPLATES: "email-templates",
  ATTACHMENTS: "attachments",
  ASSETS: "company-assets",
} as const;

export const ALLOWED_ATTACHMENT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  contentType: string
): Promise<string> {
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function deleteFile(bucket: string, path: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function downloadFile(
  bucket: string,
  path: string
): Promise<ArrayBuffer> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Download failed: ${error?.message}`);
  return data.arrayBuffer();
}

export function extractStoragePath(url: string, bucket: string): string {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = url.indexOf(marker);
  if (index === -1) return url;
  return url.slice(index + marker.length);
}
