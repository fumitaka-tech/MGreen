import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deletePlantById } from "@/app/actions/plants";
import { EditDialog } from "@/components/edit-dialog";
import { GrowthLogSection } from "@/components/growth-log";
import { PlantForm } from "@/components/plant-form";
import { fetchGrowthLogsWithPhotos } from "@/lib/growth-logs-query";
import { areaTypeLabel, formatDate } from "@/lib/utils";
import type { AreaOption, PlantWithArea } from "@/types/database";

const INITIAL_LOGS_LIMIT = 20;

export default async function PlantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: plantData }, { data: allAreas }, logsResult] =
    await Promise.all([
      supabase
        .from("plants")
        .select("*, areas(id, name, type)")
        .eq("id", id)
        .single(),
      supabase.from("areas").select("id, name, type").order("name"),
      fetchGrowthLogsWithPhotos(supabase, id, { limit: INITIAL_LOGS_LIMIT }),
    ]);

  if (!plantData) notFound();

  const plant = plantData as unknown as PlantWithArea;
  const area = plant.areas;
  const { logs, total: totalLogCount } = logsResult;

  return (
    <div className="page-stack">
      <div>
        <Link href={`/areas/${area.id}`} className="back-link">
          ← {area.name} に戻る
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="page-title">{plant.nickname}</h1>
            {plant.species_name && (
              <p className="mt-1 text-base text-green-600">
                {plant.species_name}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              {area.name}（{areaTypeLabel(area.type)}）
            </p>
            {plant.planted_at && (
              <p className="mt-1 text-sm text-gray-500">
                植えた日: {formatDate(plant.planted_at)}
              </p>
            )}
            {plant.notes && (
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {plant.notes}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <EditDialog title="植物の情報を編集">
              <PlantForm
                areas={allAreas ?? []}
                plant={{
                  id: plant.id,
                  area_id: plant.area_id,
                  nickname: plant.nickname,
                  species_name: plant.species_name,
                  planted_at: plant.planted_at,
                  notes: plant.notes,
                  created_at: plant.created_at,
                }}
              />
            </EditDialog>
            <form action={deletePlantById.bind(null, id, area.id)}>
              <button type="submit" className="btn-danger-text">
                削除
              </button>
            </form>
          </div>
        </div>
      </div>

      <GrowthLogSection
        plantId={id}
        plantNickname={plant.nickname}
        plantSpeciesName={plant.species_name}
        logs={logs}
        totalLogCount={totalLogCount}
      />
    </div>
  );
}
