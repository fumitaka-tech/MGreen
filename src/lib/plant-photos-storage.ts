import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "plant-photos";

export function photoUrlToStoragePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

export async function deleteStoragePathsFromUrls(
  supabase: SupabaseClient,
  urls: string[]
): Promise<void> {
  const paths = [
    ...new Set(
      urls
        .map(photoUrlToStoragePath)
        .filter((path): path is string => path !== null)
    ),
  ];

  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(error.message);
}

async function listStoragePathsUnderPrefix(
  supabase: SupabaseClient,
  prefix: string
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (item.id === null) {
        const nested = await listStoragePathsUnderPrefix(supabase, fullPath);
        paths.push(...nested);
      } else {
        paths.push(fullPath);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return paths;
}

export async function deleteAllStorageForPlant(
  supabase: SupabaseClient,
  plantId: string
): Promise<void> {
  const paths = await listStoragePathsUnderPrefix(supabase, plantId);
  if (paths.length === 0) return;

  const batchSize = 100;
  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw new Error(error.message);
  }
}

export async function collectGrowthLogPhotoUrls(
  supabase: SupabaseClient,
  logId: string
): Promise<string[]> {
  const urls = new Set<string>();

  const { data: log, error: logError } = await supabase
    .from("growth_logs")
    .select("photo_url")
    .eq("id", logId)
    .single();

  if (logError) throw new Error(logError.message);
  if (log?.photo_url) urls.add(log.photo_url);

  const { data: photos, error: photosError } = await supabase
    .from("growth_log_photos")
    .select("photo_url")
    .eq("growth_log_id", logId);

  if (photosError) throw new Error(photosError.message);
  for (const photo of photos ?? []) {
    if (photo.photo_url) urls.add(photo.photo_url);
  }

  return [...urls];
}
