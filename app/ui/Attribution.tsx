import { clsx } from "clsx";
import { Link } from "@/components/app/Link";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { User } from "@/lib/types";
import { getUserUrl } from "@/lib/utils/url";

const SIZE_SETTINGS = {
  default: {
    gap: "gap-2",
    avatarSize: 24,
    textClass: "text-sm font-bold",
  },
  "4xl": {
    gap: "gap-2",
    avatarSize: 42,
    textClass: "text-2xl md:text-4xl font-bold",
  },
} as const;

interface AttributionProps {
  user: User;
  size?: keyof typeof SIZE_SETTINGS;
  className?: string;
  showUsername?: boolean;
  disableLink?: boolean;
}

export const Attribution = ({
  user,
  size = "default",
  className,
  showUsername = true,
  disableLink = false,
}: AttributionProps) => {
  const settings = SIZE_SETTINGS[size];
  const content = (
    <>
      <UserAvatar user={user} size={settings.avatarSize} />
      {showUsername && (
        <span className={settings.textClass}>{user.displayName}</span>
      )}
    </>
  );
  const sharedClassName = clsx("flex items-center", settings.gap, className);

  if (disableLink) {
    return <span className={sharedClassName}>{content}</span>;
  }

  return (
    <Link href={getUserUrl(user)} className={sharedClassName}>
      {content}
    </Link>
  );
};
