"use client";

import { SunflowerMascot } from "@/components/Mascots";
import { useSignedPhotos } from "@/lib/photos";

/**
 * Renders a private-bucket photo via a user-session signed URL.
 * `urls` may supply pre-batched signed URLs (feed lists); otherwise the
 * component signs its own path. While signing: shimmer. No path or access
 * denied: mascot fallback.
 */
export function PhotoImg({ path, urls, size = 64 }: {
  path: string | null | undefined;
  urls?: Record<string, string | null>;
  size?: number;
}) {
  const own = useSignedPhotos(!urls && path ? [path] : []);
  if (!path) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <SunflowerMascot size={size} />
      </div>
    );
  }
  const map = urls ?? own;
  const src = map[path];
  if (typeof src === "string" && src.length > 0) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="h-full w-full object-cover" />;
  }
  if (Object.hasOwn(map, path)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <SunflowerMascot size={size} />
      </div>
    );
  }
  return <div className="h-full w-full animate-pulse" style={{ background: "rgba(27,16,48,.08)" }} aria-label="Loading photo" />;
}
