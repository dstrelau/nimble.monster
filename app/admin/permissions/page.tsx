import Link from "next/link";
import { notFound } from "next/navigation";
import { PermissionCard } from "@/components/admin/PermissionCard";
import { isAdmin } from "@/lib/auth";
import {
  getPermissionUsers,
  PERMISSION_DESCRIPTIONS,
  PERMISSIONS,
} from "@/lib/services/permissions";

export default async function PermissionsPage() {
  if (!(await isAdmin())) notFound();

  const usersByPermission = await getPermissionUsers();

  return (
    <div className="py-8 space-y-8">
      <Link href="/admin" className="text-primary hover:underline">
        Back to Admin
      </Link>
      <h1 className="text-3xl font-bold">Permissions</h1>
      <div className="space-y-4">
        {PERMISSIONS.map((permission) => (
          <PermissionCard
            key={permission}
            permission={permission}
            description={PERMISSION_DESCRIPTIONS[permission]}
            users={usersByPermission[permission]}
          />
        ))}
      </div>
    </div>
  );
}
