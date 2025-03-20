import type { User } from "@/lib/types";

export const Attribution = ({ user }: { user: User }) => (
  <div className="flex items-center gap-2">
    <img
      src={`https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`}
      alt={user.username}
      className="size-6 rounded-full"
    />
    <span className="text-sm">{user.username}</span>
  </div>
);
