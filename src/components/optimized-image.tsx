"use client";

import { useState } from "react";
import { getDisplayImageUrl } from "@/lib/photo-url";

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  fit = "contain",
  loading = "lazy",
  fetchPriority,
}: {
  src: string;
  alt: string;
  width: number;
  height?: number;
  className?: string;
  fit?: "cover" | "contain";
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const optimizedSrc = getDisplayImageUrl(src, {
    width,
    height,
    quality: 80,
    resize: fit,
  });
  const [displaySrc, setDisplaySrc] = useState(optimizedSrc);

  const fitClass =
    fit === "cover"
      ? "h-full w-full object-cover"
      : "block max-h-full max-w-full object-contain";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      className={className ? `${fitClass} ${className}` : fitClass}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => {
        if (displaySrc !== src) setDisplaySrc(src);
      }}
    />
  );
}
