import Link from "next/link";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { User } from "@/lib/types";

export const Attribution = ({ user }: { user: User }) => (
  <Link
    href={`/u/${user.username}`}
    className="flex items-center gap-2 hover:underline"
  >
    <UserAvatar user={user} size={24} />
    <span className="text-sm">{user.username}</span>
  </Link>
);
