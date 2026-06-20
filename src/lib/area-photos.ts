import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function getRecentAreaPhotoUrls(
  supabase: SupabaseClient<Database>,
  plantIds: string[],
  limit = 4
): Promise<string[]> {
  if (plantIds.length === 0) return [];

  const { data: logs } = await supabase
    .from("growth_logs")
    .select("id, photo_url, logged_at")
    .in("plant_id", plantIds)
    .order("logged_at", { ascending: false })
    .limit(20);

  if (!logs?.length) return [];

  const logIds = logs.map((log) => log.id);
  const logOrder = new Map(
    logs.map((log, index) => [log.id, { index, logged_at: log.logged_at }])
  );

  const { data: photos } = await supabase
    .from("growth_log_photos")
    .select("photo_url, growth_log_id")
    .in("growth_log_id", logIds);

  const candidates: { url: string; index: number }[] = [];

  for (const log of logs) {
    if (log.photo_url) {
      candidates.push({
        url: log.photo_url,
        index: logOrder.get(log.id)!.index,
      });
    }
  }

  for (const photo of photos ?? []) {
    const meta = logOrder.get(photo.growth_log_id);
    if (meta) {
      candidates.push({ url: photo.photo_url, index: meta.index });
    }
  }

  candidates.sort((a, b) => a.index - b.index);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const { url } of candidates) {
    if (seen.has(url)) continue;
    seen.add(url);
    result.push(url);
    if (result.length >= limit) break;
  }

  return result;
}

export function formatPlantNicknames(
  plants: { nickname: string }[],
  maxLength = 40
): string {
  if (plants.length === 0) return "植物なし";

  const line = plants.map((p) => p.nickname).join("、");

  if (line.length <= maxLength) return line;

  let truncated = "";
  for (const plant of plants) {
    const next = truncated ? `${truncated}、${plant.nickname}` : plant.nickname;
    if (next.length > maxLength - 1) break;
    truncated = next;
  }

  return truncated ? `${truncated}…` : `${plants[0].nickname}…`;
}
