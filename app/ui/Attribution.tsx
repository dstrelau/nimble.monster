import { Link } from "@/components/app/Link";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { User } from "@/lib/types";

export const Attribution = ({ user }: { user: User }) => (
  <Link href={`/u/${user.username}`} className="flex items-center gap-2">
    <UserAvatar user={user} size={24} />
    <span className="text-sm font-bold">{user.username}</span>
  </Link>
);
