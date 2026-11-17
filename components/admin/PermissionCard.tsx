"use client";

import { updateUserPermission } from "@/app/%5Factions/updateUserPermission/contract";
import { call } from "@/lib/contract";
import type { Permission } from "@/lib/services/permissions";
import type { User } from "@/lib/types";
import { UserAccessCard } from "./UserAccessCard";

interface PermissionCardProps {
  permission: Permission;
  description: string;
  users: User[];
}

export function PermissionCard({
  permission,
  description,
  users,
}: PermissionCardProps) {
  return (
    <UserAccessCard
      name={permission}
      description={description}
      users={users}
      emptyMessage="No users have this permission."
      onChange={(userId, granted) =>
        call(updateUserPermission, { userId, permission, granted })
      }
    />
  );
}
