import type { ReactNode } from "react";
import { areaTypeLabel } from "@/lib/utils";

export function AreaHero({
  name,
  type,
  description,
  photoUrls,
  actions,
}: {
  name: string;
  type: "outdoor" | "indoor";
  description: string | null;
  photoUrls: string[];
  actions?: ReactNode;
}) {
  const photos = photoUrls.slice(0, 4);

  return (
    <div className="relative min-h-[11rem] overflow-hidden rounded-2xl shadow-sm sm:min-h-[12rem]">
      <div className="absolute inset-0">
        {photos.length > 0 ? (
          <div
            className={`grid h-full w-full ${
              photos.length === 1
                ? "grid-cols-1"
                : photos.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 grid-rows-2"
            }`}
          >
            {photos.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className={`relative ${
                  photos.length === 3 && index === 0 ? "row-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-200 via-green-100 to-emerald-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      </div>

      <div className="relative p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                type === "outdoor"
                  ? "bg-sky-400/30 text-sky-50"
                  : "bg-amber-400/30 text-amber-50"
              }`}
            >
              {areaTypeLabel(type)}
            </span>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{name}</h1>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                {description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
