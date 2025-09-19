import { clsx } from "clsx";
import { Link } from "@/components/app/Link";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { User } from "@/lib/types";

const SIZE_SETTINGS = {
  default: {
    gap: "gap-2",
    avatarSize: 24,
    textClass: "text-sm font-bold",
  },
  "4xl": {
    gap: "gap-2",
    avatarSize: 42,
    textClass: "text-4xl font-bold",
  },
} as const;

interface AttributionProps {
  user: User;
  size?: keyof typeof SIZE_SETTINGS;
  className?: string;
}

export const Attribution = ({
  user,
  size = "default",
  className,
}: AttributionProps) => {
  const settings = SIZE_SETTINGS[size];
  return (
    <Link
      href={`/u/${user.username}`}
      className={clsx("flex items-center", settings.gap, className)}
    >
      <UserAvatar user={user} size={settings.avatarSize} />
      <span className={settings.textClass}>{user.displayName}</span>
    </Link>
  );
};
