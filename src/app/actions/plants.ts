"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteAllStorageForPlant,
  deleteStoragePathsFromUrls,
} from "@/lib/plant-photos-storage";

export async function createPlant(formData: FormData) {
  const areaId = formData.get("area_id") as string;
  const nickname = formData.get("nickname") as string;
  const speciesName = (formData.get("species_name") as string) || null;
  const plantedAt = (formData.get("planted_at") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!areaId) throw new Error("エリアを選択してください");
  if (!nickname?.trim()) throw new Error("名前を入力してください");

  const supabase = await createClient();
  const { error } = await supabase
    .from("plants")
    .insert({
      area_id: areaId,
      nickname: nickname.trim(),
      species_name: speciesName?.trim() || null,
      planted_at: plantedAt || null,
      notes: notes?.trim() || null,
    });

  if (error) throw new Error(error.message);

  revalidatePath(`/areas/${areaId}`);
  revalidatePath("/");
}

export async function createPlantReturnId(formData: FormData): Promise<string> {
  const areaId = formData.get("area_id") as string;
  const nickname = formData.get("nickname") as string;
  const speciesName = (formData.get("species_name") as string) || null;
  const plantedAt = (formData.get("planted_at") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!areaId) throw new Error("エリアを選択してください");
  if (!nickname?.trim()) throw new Error("名前を入力してください");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plants")
    .insert({
      area_id: areaId,
      nickname: nickname.trim(),
      species_name: speciesName?.trim() || null,
      planted_at: plantedAt || null,
      notes: notes?.trim() || null,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("植物の登録に失敗しました");

  revalidatePath(`/areas/${areaId}`);
  revalidatePath("/");

  return data.id;
}

export async function updatePlant(formData: FormData) {
  const plantId = formData.get("plant_id") as string;
  const areaId = formData.get("area_id") as string;
  const nickname = formData.get("nickname") as string;
  const speciesName = (formData.get("species_name") as string) || null;
  const plantedAt = (formData.get("planted_at") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!plantId) throw new Error("植物が指定されていません");
  if (!areaId) throw new Error("エリアを選択してください");
  if (!nickname?.trim()) throw new Error("名前を入力してください");

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("plants")
    .select("area_id")
    .eq("id", plantId)
    .single();

  const { error } = await supabase
    .from("plants")
    .update({
      area_id: areaId,
      nickname: nickname.trim(),
      species_name: speciesName?.trim() || null,
      planted_at: plantedAt || null,
      notes: notes?.trim() || null,
    })
    .eq("id", plantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/plants/${plantId}`);
  revalidatePath(`/areas/${areaId}`);
  if (existing?.area_id && existing.area_id !== areaId) {
    revalidatePath(`/areas/${existing.area_id}`);
  }
  revalidatePath("/");
}

export async function deletePlantById(plantId: string, areaId: string) {
  const supabase = await createClient();

  await deleteAllStorageForPlant(supabase, plantId);

  const { error } = await supabase.from("plants").delete().eq("id", plantId);

  if (error) throw new Error(error.message);

  revalidatePath(`/areas/${areaId}`);
  revalidatePath(`/plants/${plantId}`);
  revalidatePath("/");
  redirect(`/areas/${areaId}`);
}
