import Image from "next/image";
import { User } from "@/lib/types";
import clsx from "clsx";

export const UserAvatar = ({
  user,
  size,
  className,
}: {
  user: User;
  size: number;
  className?: string;
}) => (
  <Image
    src={
      user.avatar.startsWith("https")
        ? user.avatar
        : `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`
    }
    alt={user.username}
    className={clsx("rounded-full", className)}
    width={size}
    height={size}
  />
);
