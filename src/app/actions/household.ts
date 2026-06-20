"use server";

import { createClient } from "@/lib/supabase/server";

export async function ensureHousehold() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membershipData } = await supabase
    .from("household_members")
    .select("household_id, households(id, name)")
    .eq("user_id", user.id)
    .maybeSingle();

  const membership = membershipData as {
    household_id: string;
    households: { id: string; name: string };
  } | null;

  if (membership?.households) {
    return membership.households;
  }

  const { data, error } = await supabase.rpc("create_household_for_user", {
    household_name: "わが家",
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as { id: string; name: string; created_at: string }[] | null;
  const household = rows?.[0];

  if (!household) {
    throw new Error("世帯の作成に失敗しました");
  }

  return { id: household.id, name: household.name };
}

export async function getHouseholdId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const household = await ensureHousehold();
  return household?.id ?? null;
}
