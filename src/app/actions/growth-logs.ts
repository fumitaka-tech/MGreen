"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  collectGrowthLogPhotoUrls,
  deleteStoragePathsFromUrls,
} from "@/lib/plant-photos-storage";
import { parseDatetimeLocalAsJST } from "@/lib/utils";
import type { AiInsights } from "@/types/plant-ai";

export async function createGrowthLog(formData: FormData) {
  const plantId = formData.get("plant_id") as string;
  const note = (formData.get("note") as string) || null;
  const loggedAt = (formData.get("logged_at") as string) || null;
  const photoUrlsRaw = formData.get("photo_urls") as string | null;
  const aiInsightsRaw = formData.get("ai_insights") as string | null;

  if (!plantId) throw new Error("植物が指定されていません");

  let photoUrls: string[] = [];
  if (photoUrlsRaw) {
    try {
      photoUrls = JSON.parse(photoUrlsRaw) as string[];
    } catch {
      throw new Error("写真データの形式が不正です");
    }
  }

  if (photoUrls.length === 0) {
    throw new Error("写真は必須です。1枚以上追加してください。");
  }

  let aiInsights: AiInsights | null = null;
  if (aiInsightsRaw) {
    try {
      aiInsights = JSON.parse(aiInsightsRaw) as AiInsights;
    } catch {
      throw new Error("AI 解析データの形式が不正です");
    }
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("create_growth_log_with_photos", {
    p_plant_id: plantId,
    p_note: note?.trim() || null,
    p_logged_at: loggedAt
      ? parseDatetimeLocalAsJST(loggedAt)
      : new Date().toISOString(),
    p_photo_urls_json: photoUrls,
    p_ai_insights_json: aiInsights,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/");
}

export async function updateGrowthLog(formData: FormData) {
  const logId = formData.get("log_id") as string;
  const plantId = formData.get("plant_id") as string;
  const note = (formData.get("note") as string) || null;
  const loggedAt = formData.get("logged_at") as string;
  const photosRaw = formData.get("photos") as string | null;
  const aiInsightsRaw = formData.get("ai_insights") as string | null;

  if (!logId || !plantId) throw new Error("記録が指定されていません");
  if (!loggedAt) throw new Error("記録日を入力してください");

  let photos: { id?: string; url: string }[] = [];
  if (photosRaw) {
    try {
      photos = JSON.parse(photosRaw) as { id?: string; url: string }[];
    } catch {
      throw new Error("写真データの形式が不正です");
    }
  }

  if (photos.length === 0) {
    throw new Error("写真は1枚以上必要です");
  }

  let aiInsights: AiInsights | null | undefined;
  if (aiInsightsRaw) {
    try {
      aiInsights = JSON.parse(aiInsightsRaw) as AiInsights;
    } catch {
      throw new Error("AI 解析データの形式が不正です");
    }
  }

  const supabase = await createClient();
  const previousUrls = await collectGrowthLogPhotoUrls(supabase, logId);

  const { error } = await supabase.rpc("update_growth_log_with_photos", {
    p_log_id: logId,
    p_plant_id: plantId,
    p_note: note?.trim() || null,
    p_logged_at: parseDatetimeLocalAsJST(loggedAt),
    p_photos_json: photos,
    p_ai_insights_json: aiInsights ?? null,
  });

  if (error) throw new Error(error.message);

  const keptUrls = new Set(photos.map((photo) => photo.url));
  const removedUrls = previousUrls.filter((url) => !keptUrls.has(url));
  if (removedUrls.length > 0) {
    await deleteStoragePathsFromUrls(supabase, removedUrls);
  }

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/");
}

export async function deleteGrowthLog(logId: string, plantId: string) {
  const supabase = await createClient();
  const photoUrls = await collectGrowthLogPhotoUrls(supabase, logId);

  const { error } = await supabase
    .from("growth_logs")
    .delete()
    .eq("id", logId);

  if (error) throw new Error(error.message);

  if (photoUrls.length > 0) {
    await deleteStoragePathsFromUrls(supabase, photoUrls);
  }

  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/");
}
