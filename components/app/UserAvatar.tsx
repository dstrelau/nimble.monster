import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";

type AvatarSize = "sm" | "md" | "lg";

interface UserAvatarProps {
  user: User | { id?: string; name?: string | null; image?: string | null };
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

  // Check if user is empty (for logged-out state)
  const isEmpty = !user || Object.keys(user).length === 0;

  if (isEmpty) {
    return (
      <Avatar className={className} style={{ width: sizeInPixels, height: sizeInPixels }}>
        <AvatarImage src="https://cdn.discordapp.com/embed/avatars/0.png" alt="Discord" />
        <AvatarFallback>D</AvatarFallback>
      </Avatar>
    );
  }

  // Handle NextAuth session user format
  const isSessionUser = "id" in user && !("discordId" in user);
  const avatarSrc = isSessionUser
    ? user.image
    : "avatar" in user && user.avatar
      ? user.avatar?.startsWith("https")
        ? user.avatar
        : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
      : null;

  const displayName = isSessionUser
    ? user.name
    : "username" in user
      ? user.username
      : "";
  const fallbackLetter = displayName?.charAt(0).toUpperCase() || "?";

  return (
    <Avatar
      className={className}
      style={{ width: sizeInPixels, height: sizeInPixels }}
    >
      {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName || "User"} />}
      <AvatarFallback>{fallbackLetter}</AvatarFallback>
    </Avatar>
  );
};
