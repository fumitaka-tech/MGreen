import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImageForStorage } from "@/lib/image";

const BUCKET = "plant-photos";

export async function uploadPlantPhotos(
  supabase: SupabaseClient,
  plantId: string,
  files: File[],
  options?: { logId?: string }
): Promise<string[]> {
  const timestamp = Date.now();
  const photoUrls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const compressed = await compressImageForStorage(files[i]);
    const path = options?.logId
      ? `${plantId}/${options.logId}/${timestamp}-${i}.jpg`
      : `${plantId}/${timestamp}-${i}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressed, {
        upsert: false,
        contentType: "image/jpeg",
      });

    if (uploadError) throw new Error(uploadError.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET).getPublicUrl(path);

    photoUrls.push(publicUrl);
  }

  return photoUrls;
}
