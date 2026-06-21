import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  GrowthLog,
  GrowthLogPhoto,
  GrowthLogWithPhotos,
} from "@/types/database";

function attachPhotosToLogs(
  logs: GrowthLog[],
  photos: GrowthLogPhoto[]
): GrowthLogWithPhotos[] {
  return logs.map((log) => ({
    ...log,
    growth_log_photos: photos
      .filter((photo) => photo.growth_log_id === log.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ id, photo_url, sort_order }) => ({
        id,
        photo_url,
        sort_order,
      })),
  }));
}

export async function fetchGrowthLogsWithPhotos(
  supabase: SupabaseClient<Database>,
  plantId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ logs: GrowthLogWithPhotos[]; total: number }> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const { data: logsRaw, count, error } = await supabase
    .from("growth_logs")
    .select("*", { count: "exact" })
    .eq("plant_id", plantId)
    .order("logged_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  const logs = (logsRaw ?? []) as GrowthLog[];
  const logIds = logs.map((log) => log.id);

  let photosRaw: GrowthLogPhoto[] = [];
  if (logIds.length > 0) {
    const { data, error: photosError } = await supabase
      .from("growth_log_photos")
      .select("*")
      .in("growth_log_id", logIds)
      .order("sort_order", { ascending: true });

    if (photosError) throw new Error(photosError.message);
    photosRaw = (data ?? []) as GrowthLogPhoto[];
  }

  return {
    logs: attachPhotosToLogs(logs, photosRaw),
    total: count ?? logs.length,
  };
}
