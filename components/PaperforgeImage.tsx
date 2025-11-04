import Image from "next/image";
import { getPaperforgeEntry } from "@/lib/paperforge-catalog";
import { cn } from "@/lib/utils";

interface PaperforgeImageProps {
  id?: string;
  name?: string;
  className?: string;
  alt?: string;
}

export function PaperforgeImage({
  id,
  name,
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
  const src = `/paperforge/${entry.folder}/portrait.png`;
  const altText = alt || entry.name;

  return (
    <Image
      src={src}
      alt={altText}
      width={200}
      height={200}
      className={cn(className)}
    />
  );
}
