import { getPaperforgeEntry } from "@/lib/paperforge-catalog";
import { cn } from "@/lib/utils";

const BUCKET_NAME = process.env.NEXT_PUBLIC_BUCKET_NAME;

const AVAILABLE_SIZES = [50, 100, 200, 400] as const;

function pickSize(requestedSize: number): number {
  for (const size of AVAILABLE_SIZES) {
    if (size >= requestedSize) return size;
  }
  return AVAILABLE_SIZES[AVAILABLE_SIZES.length - 1];
}

export function getPaperforgeImageUrl(
  folder: string,
  size: number = 400
): string {
  const imageSize = pickSize(size);
  if (BUCKET_NAME) {
    return `https://${BUCKET_NAME}.fly.storage.tigris.dev/paperforge/${folder}/${imageSize}.png`;
  }
  return `/paperforge/${folder}/${imageSize}.png`;
}

interface PaperforgeImageProps {
  id?: string;
  name?: string;
  style?: "portrait" | "full";
  size?: number;
  className?: string;
  alt?: string;
}

export function PaperforgeImage({
  id,
  name,
  size = 400,
  className,
  alt,
}: PaperforgeImageProps) {
  const identifier = id || name;
  if (!identifier) {
    return null;
  }

  const entry = getPaperforgeEntry(identifier);
  if (!entry) {
    return null;
  }

  const src = getPaperforgeImageUrl(entry.folder, size);
  const altText = alt || entry.name;

  return (
    // biome-ignore lint/performance/noImgElement: Using pre-sized images
    <img
      src={src}
      alt={altText}
      width={size}
      height={size}
      className={cn(className)}
    />
  );
}
