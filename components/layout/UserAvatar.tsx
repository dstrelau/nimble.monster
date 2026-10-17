"use client";

import Image from "next/image";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/lib/types";

type AvatarSize = "sm" | "md" | "lg";

interface UserAvatarProps {
  user?: User;
  size: AvatarSize | number;
  className?: string;
}

const getSizeInPixels = (size: AvatarSize | number): number => {
  if (typeof size === "number") return size;
  switch (size) {
    case "sm":
      return 32;
    case "md":
      return 40;
    case "lg":
      return 48;
    default:
      return 40;
  }
};

export const UserAvatar = ({ user, size, className }: UserAvatarProps) => {
  const sizeInPixels = getSizeInPixels(size);
  const src = user
    ? user.imageUrl
    : "https://cdn.discordapp.com/embed/avatars/0.png";
  const [failedSrc, setFailedSrc] = useState<string>();
  const fallbackLetter = user?.displayName?.charAt(0).toUpperCase() || "?";

  return (
    <Avatar
      className={className}
      style={{ width: sizeInPixels, height: sizeInPixels }}
    >
      {src && src !== failedSrc ? (
        // The browser can load this from SSR HTML instead of waiting for hydration.
        <Image
          src={src}
          alt={user ? user.displayName || "User" : "Discord"}
          width={Math.round(sizeInPixels)}
          height={Math.round(sizeInPixels)}
          unoptimized
          loading="eager"
          className="aspect-square size-full"
          data-slot="avatar-image"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <AvatarFallback className={user ? "bg-transparent" : undefined}>
          {fallbackLetter}
        </AvatarFallback>
      )}
    </Avatar>
  );
};
