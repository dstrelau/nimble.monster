import { PaperforgeImage } from "@/components/paperforge/PaperforgeImage";
import {
  getMonsterArtworkUrl,
  type MonsterArtwork,
} from "@/lib/monster-artwork";
import { cn } from "@/lib/utils";

interface MonsterImageProps {
  paperforgeId?: string;
  customArtwork?: MonsterArtwork | null;
  size?: number;
  className?: string;
  alt?: string;
}

export function MonsterImage({
  paperforgeId,
  customArtwork,
  size = 88,
  className,
  alt,
}: MonsterImageProps) {
  if (customArtwork) {
    return (
      // biome-ignore lint/performance/noImgElement: Uploaded artwork has pre-sized WebP variants.
      <img
        src={getMonsterArtworkUrl(customArtwork, size)}
        alt={alt ?? "Custom monster artwork"}
        width={size}
        height={size}
        className={cn("aspect-square rounded-full object-cover", className)}
      />
    );
  }
  return (
    <PaperforgeImage
      id={paperforgeId}
      size={size}
      className={className}
      alt={alt}
    />
  );
}
