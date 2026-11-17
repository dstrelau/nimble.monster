import { defineRoute } from "@/lib/contract";
import type { Permission } from "@/lib/services/permissions";

interface UpdateUserPermissionInput {
  userId: string;
  permission: Permission;
  granted: boolean;
}

export const updateUserPermission = defineRoute<
  UpdateUserPermissionInput,
  { success: true }
>({ method: "POST", path: () => "/_actions/updateUserPermission" });
