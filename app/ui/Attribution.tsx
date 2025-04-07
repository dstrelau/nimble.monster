import type { User } from "@/lib/types";
import Image from "next/image";

export const Attribution = ({ user }: { user: User }) => (
  <div className="flex items-center gap-2">
    <Image
      src={user.avatar}
      alt={user.username}
      className="size-6 rounded-full"
      width={24}
      height={24}
    />
    <span className="text-sm">{user.username}</span>
  </div>
);
