import Link from "next/link";
import { notFound } from "next/navigation";
import { FeatureFlagCard } from "@/components/admin/FeatureFlagCard";
import { isAdmin } from "@/lib/auth";
import {
  FEATURE_FLAGS,
  getFeatureFlagUsers,
} from "@/lib/services/featureFlags";

export default async function FeatureFlagsPage() {
  if (!(await isAdmin())) notFound();

  const usersByFlag = await getFeatureFlagUsers();

  return (
    <div className="py-8 space-y-8">
      <Link href="/admin" className="text-primary hover:underline">
        Back to Admin
      </Link>
      <h1 className="text-3xl font-bold">Feature Flags</h1>
      <p className="text-sm text-muted-foreground">
        Changes apply per user. They must refresh the site to update feature
        access in an open tab.
      </p>
      <div className="space-y-4">
        {FEATURE_FLAGS.map((feature) => (
          <FeatureFlagCard
            key={feature}
            feature={feature}
            users={usersByFlag[feature]}
          />
        ))}
      </div>
    </div>
  );
}
