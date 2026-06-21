const SUPABASE_OBJECT_PREFIX = "/storage/v1/object/public/";
const SUPABASE_RENDER_PREFIX = "/storage/v1/render/image/public/";

export function getDisplayImageUrl(
  url: string,
  options?: { width?: number; quality?: number }
): string {
  if (!options?.width || !url.includes(SUPABASE_OBJECT_PREFIX)) {
    return url;
  }

  const transformed = url.replace(SUPABASE_OBJECT_PREFIX, SUPABASE_RENDER_PREFIX);
  const parsed = new URL(transformed);
  parsed.searchParams.set("width", String(options.width));
  parsed.searchParams.set("quality", String(options.quality ?? 80));
  parsed.searchParams.set("resize", "cover");
  return parsed.toString();
}
