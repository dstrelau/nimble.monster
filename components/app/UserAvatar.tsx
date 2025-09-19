import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  console.log("useravatar", user);

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

  const fallbackLetter = user.displayName?.charAt(0).toUpperCase() || "?";

  return (
    <Avatar
      className={className}
      style={{ width: sizeInPixels, height: sizeInPixels }}
    >
      <AvatarImage src={user.imageUrl} alt={user.displayName || "User"} />
      <AvatarFallback className="bg-transparent">
        {fallbackLetter}
      </AvatarFallback>
    </Avatar>
  );
};
