import Image from "next/image";
import { getPaperforgeEntry } from "@/lib/paperforge-catalog";
import { cn } from "@/lib/utils";

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
  style = "portrait",
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

  // Map type to actual filename
  const filename = style === "portrait" ? "portrait.png" : "full.png";
  const src = `/paperforge/${entry.folder}/${filename}`;
  const altText = alt || entry.name;

  return (
    <Image
      src={src}
      alt={altText}
      width={size}
      height={size}
      className={cn(className)}
    />
  );
}
