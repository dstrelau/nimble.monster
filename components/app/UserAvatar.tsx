import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/types";

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

  if (!user) {
    return (
      <Avatar
        className={className}
        style={{ width: sizeInPixels, height: sizeInPixels }}
      >
        <AvatarImage
          src="https://cdn.discordapp.com/embed/avatars/0.png"
          alt="Discord"
        />
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }

  const avatarSrc = getUserAvatarUrl(user);
  const displayName = getUserDisplayName(user);
  const fallbackLetter = displayName?.charAt(0).toUpperCase() || "?";

  return (
    <Avatar
      className={className}
      style={{ width: sizeInPixels, height: sizeInPixels }}
    >
      <AvatarImage src={avatarSrc} alt={displayName || "User"} />
      <AvatarFallback className="bg-transparent">
        {fallbackLetter}
      </AvatarFallback>
    </Avatar>
  );
};
