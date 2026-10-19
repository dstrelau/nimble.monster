import { notFound } from "next/navigation";
import {
  cancelOfficialConditionsUploadAction,
  commitOfficialConditionsAction,
} from "@/app/admin/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/auth";
import { listOfficialConditions } from "@/lib/db/condition";
import type { ConditionSessionData } from "@/lib/services/conditions/official";
import { readPreviewSession } from "@/lib/services/preview-session";

interface PageProps {
  searchParams: Promise<{ session?: string }>;
}

export default async function PreviewConditionsPage({
  searchParams,
}: PageProps) {
  if (!(await isAdmin())) notFound();
  const { session: sessionKey } = await searchParams;
  if (!sessionKey) notFound();
  const sessionData = await readPreviewSession<ConditionSessionData>(
    "conditions",
    sessionKey
  );
  if (!sessionData) notFound();
  const existing = await listOfficialConditions();

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Preview Official Conditions</h1>
        <div className="flex gap-4">
          <form
            action={cancelOfficialConditionsUploadAction.bind(null, sessionKey)}
          >
            <Button type="submit" variant="destructive">
              Cancel
            </Button>
          </form>
          <form action={commitOfficialConditionsAction.bind(null, sessionKey)}>
            <Button type="submit">Approve All</Button>
          </form>
        </div>
      </div>
      {sessionData.conditions.map(({ attributes }) => {
        const previous = existing.find(
          (condition) =>
            condition.name.toLowerCase() === attributes.name.toLowerCase()
        );
        const status = !previous
          ? "New"
          : previous.name === attributes.name &&
              previous.description === attributes.description
            ? "Unchanged"
            : "Updated";
        return (
          <Card key={attributes.name}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {attributes.name}
                <Badge variant="secondary">{status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="mb-2 font-medium">Current</h2>
                <p className="whitespace-pre-wrap">
                  {previous?.description ?? "Not yet imported"}
                </p>
              </div>
              <div>
                <h2 className="mb-2 font-medium">Proposed</h2>
                <p className="whitespace-pre-wrap">{attributes.description}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
