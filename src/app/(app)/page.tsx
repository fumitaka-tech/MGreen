import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ensureHousehold } from "@/app/actions/household";
import { EmptyState } from "@/components/empty-state";
import { formatPlantNicknames } from "@/lib/area-photos";
import { areaTypeLabel, formatDateTime } from "@/lib/utils";
import type { Area, GrowthLogWithPlant } from "@/types/database";

type AreaWithPlants = Area & {
  plants: { id: string; nickname: string }[];
};

export default async function HomePage() {
  await ensureHousehold();
  const supabase = await createClient();

  const { data: areasData } = await supabase
    .from("areas")
    .select("*, plants(id, nickname)")
    .order("created_at", { ascending: true });

  const areas = (areasData ?? []) as unknown as AreaWithPlants[];

  const { data: recentLogs } = await supabase
    .from("growth_logs")
    .select("*, plants(id, nickname)")
    .order("logged_at", { ascending: false })
    .limit(5);

  const plantCount = areas.reduce((sum, area) => sum + area.plants.length, 0);

  return (
    <div className="page-stack">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="page-title">エリア</h1>
            <p className="mt-1 text-base text-green-600">
              {areas?.length ?? 0} エリア · {plantCount} 植物
            </p>
          </div>
          <Link href="/areas/new" className="btn-primary-sm">
            追加
          </Link>
        </div>

        {!areas || areas.length === 0 ? (
          <EmptyState
            title="エリアがまだありません"
            description="ベランダやリビングなど、植物を置いている場所を登録しましょう"
            action={
              <Link href="/areas/new" className="btn-primary-sm w-full sm:w-auto">
                最初のエリアを追加
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {areas.map((area) => (
              <Link
                key={area.id}
                href={`/areas/${area.id}`}
                className="card-interactive"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">{area.name}</p>
                    <p className="mt-1 truncate text-sm text-green-600">
                      {area.plants.length > 0
                        ? formatPlantNicknames(area.plants)
                        : `${areaTypeLabel(area.type)} · 植物なし`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      area.type === "outdoor"
                        ? "bg-sky-100 text-sky-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {areaTypeLabel(area.type)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recentLogs && recentLogs.length > 0 && (
        <section className="space-y-4">
          <h2 className="section-title">最近の成長記録</h2>
          <div className="space-y-3">
            {(recentLogs as unknown as GrowthLogWithPlant[]).map((log) => (
              <Link
                key={log.id}
                href={`/plants/${log.plant_id}`}
                className="card-interactive"
              >
                <p className="font-medium text-green-800">
                  {log.plants?.nickname}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {formatDateTime(log.logged_at)}
                </p>
                {log.note && (
                  <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                    {log.note}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
