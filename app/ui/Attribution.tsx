import type { User } from "@/lib/types";

import Link from "next/link";
import React from "react";
import { UserAvatar } from "./UserAvatar";

export const Attribution = ({ user }: { user: User }) => (
  <Link
    href={`/u/${user.username}`}
    className="flex items-center gap-2 hover:underline"
  >
    <UserAvatar user={user} size={24} />
    <span className="text-sm">{user.username}</span>
  </Link>
);
