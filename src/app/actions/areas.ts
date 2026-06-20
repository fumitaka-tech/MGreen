"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getHouseholdId } from "./household";
import { deleteAllStorageForPlant } from "@/lib/plant-photos-storage";
import type { AreaType } from "@/types/database";

export async function createArea(formData: FormData) {
  const householdId = await getHouseholdId();
  if (!householdId) throw new Error("ログインが必要です");

  const name = formData.get("name") as string;
  const type = formData.get("type") as AreaType;
  const description = (formData.get("description") as string) || null;

  if (!name?.trim()) throw new Error("エリア名を入力してください");

  const supabase = await createClient();
  const { error } = await supabase.from("areas").insert({
    household_id: householdId,
    name: name.trim(),
    type,
    description: description?.trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/areas");
}

export async function updateArea(formData: FormData) {
  const areaId = formData.get("area_id") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as AreaType;
  const description = (formData.get("description") as string) || null;

  if (!areaId) throw new Error("エリアが指定されていません");
  if (!name?.trim()) throw new Error("エリア名を入力してください");

  const supabase = await createClient();
  const { error } = await supabase
    .from("areas")
    .update({
      name: name.trim(),
      type,
      description: description?.trim() || null,
    })
    .eq("id", areaId);

  if (error) throw new Error(error.message);

  revalidatePath(`/areas/${areaId}`);
  revalidatePath("/");
}

export async function deleteAreaById(areaId: string) {
  const supabase = await createClient();

  const { data: plants, error: plantsError } = await supabase
    .from("plants")
    .select("id")
    .eq("area_id", areaId);

  if (plantsError) throw new Error(plantsError.message);

  for (const plant of plants ?? []) {
    await deleteAllStorageForPlant(supabase, plant.id);
  }

  const { error } = await supabase.from("areas").delete().eq("id", areaId);

  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/areas");
  redirect("/areas");
}
