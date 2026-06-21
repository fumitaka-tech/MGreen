"use client";

import { useState } from "react";
import { getDisplayImageUrl } from "@/lib/photo-url";

export function OptimizedImage({
  src,
  alt,
  width,
  className,
  loading = "lazy",
  fetchPriority,
}: {
  src: string;
  alt: string;
  width: number;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
}) {
  const optimizedSrc = getDisplayImageUrl(src, { width, quality: 80 });
  const [displaySrc, setDisplaySrc] = useState(optimizedSrc);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={() => {
        if (displaySrc !== src) setDisplaySrc(src);
      }}
    />
  );
}
