import Link from "next/link";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAreaById } from "@/app/actions/areas";
import { deletePlantById } from "@/app/actions/plants";
import { AreaHero } from "@/components/area-hero";
import { AreaForm } from "@/components/area-form";
import { EditDialog } from "@/components/edit-dialog";
import { EmptyState } from "@/components/empty-state";
import { getRecentAreaPhotoUrls } from "@/lib/area-photos";
import type { Plant } from "@/types/database";

const PlantRegistrationForm = dynamic(
  () =>
    import("@/components/plant-registration-form").then((mod) => ({
      default: mod.PlantRegistrationForm,
    })),
  {
    loading: () => (
      <div className="h-48 animate-pulse rounded-2xl bg-green-50" />
    ),
  }
);

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: area } = await supabase
    .from("areas")
    .select("*")
    .eq("id", id)
    .single();

  if (!area) notFound();

  const [{ data: plants }, { data: allAreas }] = await Promise.all([
    supabase
      .from("plants")
      .select("*")
      .eq("area_id", id)
      .order("created_at", { ascending: true }),
    supabase.from("areas").select("id, name, type").order("name"),
  ]);

  const plantList = (plants ?? []) as Plant[];
  const plantIds = plantList.map((plant) => plant.id);
  const recentPhotoUrls = await getRecentAreaPhotoUrls(supabase, plantIds);

  return (
    <div className="page-stack">
      <div>
        <Link href="/" className="back-link">
          ← エリア一覧に戻る
        </Link>
        <div className="mt-2">
          <AreaHero
            name={area.name}
            type={area.type}
            description={area.description}
            photoUrls={recentPhotoUrls}
            actions={
              <>
                <EditDialog
                  title="エリアを編集"
                  triggerClassName="rounded-lg px-3 py-1.5 text-sm text-white/90 active:bg-white/10 hover:text-white"
                >
                  <AreaForm area={area} />
                </EditDialog>
                <form action={deleteAreaById.bind(null, id)}>
                  <button type="submit" className="btn-danger-text">
                    削除
                  </button>
                </form>
              </>
            }
          />
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="section-title">植物</h2>

        {plantList.length === 0 ? (
          <EmptyState
            title="このエリアに植物がまだありません"
            description="下のフォームから植物を追加しましょう"
          />
        ) : (
          <div className="space-y-3">
            {plantList.map((plant) => (
              <div key={plant.id} className="list-item-interactive">
                <Link href={`/plants/${plant.id}`} className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">
                    {plant.nickname}
                  </p>
                  {plant.species_name && (
                    <p className="text-sm text-green-600">
                      {plant.species_name}
                    </p>
                  )}
                </Link>
                <form action={deletePlantById.bind(null, plant.id, id)}>
                  <button type="submit" className="btn-danger-text">
                    削除
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="section-title">植物を追加</h2>
        <p className="text-sm text-gray-500">
          写真を撮って AI が植物名を推定するか、植物名がわかっている場合は「植物名から探す」が使えます。登録と同時に最初の成長記録が作成されます。
        </p>
        <div className="card-form">
          <PlantRegistrationForm areas={allAreas ?? []} defaultAreaId={id} />
        </div>
      </section>
    </div>
  );
}
