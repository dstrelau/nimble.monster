import { Trash2, Unlink } from "lucide-react";
import { notFound } from "next/navigation";
import React from "react";
import {
  addAwardAssociationAction,
  createAwardAction,
  deleteAwardAction,
  removeAwardAssociationAction,
} from "@/app/admin/actions";
import { AwardBadge } from "@/components/AwardBadge";
import { AwardAssociationForm } from "@/components/admin/AwardAssociationForm";
import { AwardForm } from "@/components/admin/AwardForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAdmin } from "@/lib/auth";
import { getAwardsWithCounts, getEntitiesWithAwards } from "@/lib/db/award";

export default async function AdminAwardsPage() {
  if (!(await isAdmin())) {
    notFound();
  }

  const awards = await getAwardsWithCounts();
  const entities = await getEntitiesWithAwards();

  const awardEntityMap = new Map<
    string,
    Array<{
      type: string;
      id: string;
      name: string;
      awardIds: string[];
    }>
  >();

  for (const monster of entities.monsters) {
    for (const ma of monster.monsterAwards) {
      if (!awardEntityMap.has(ma.award.id)) {
        awardEntityMap.set(ma.award.id, []);
      }
      const existing = awardEntityMap
        .get(ma.award.id)
        ?.find((e) => e.id === monster.id);
      if (!existing) {
        awardEntityMap.get(ma.award.id)?.push({
          type: "monster",
          id: monster.id,
          name: monster.name,
          awardIds: [ma.award.id],
        });
      }
    }
  }

  for (const item of entities.items) {
    for (const ia of item.itemAwards) {
      if (!awardEntityMap.has(ia.award.id)) {
        awardEntityMap.set(ia.award.id, []);
      }
      const existing = awardEntityMap
        .get(ia.award.id)
        ?.find((e) => e.id === item.id);
      if (!existing) {
        awardEntityMap.get(ia.award.id)?.push({
          type: "item",
          id: item.id,
          name: item.name,
          awardIds: [ia.award.id],
        });
      }
    }
  }

  for (const companion of entities.companions) {
    for (const ca of companion.companionAwards) {
      if (!awardEntityMap.has(ca.award.id)) {
        awardEntityMap.set(ca.award.id, []);
      }
      const existing = awardEntityMap
        .get(ca.award.id)
        ?.find((e) => e.id === companion.id);
      if (!existing) {
        awardEntityMap.get(ca.award.id)?.push({
          type: "companion",
          id: companion.id,
          name: companion.name,
          awardIds: [ca.award.id],
        });
      }
    }
  }

  for (const subclass of entities.subclasses) {
    for (const sa of subclass.subclassAwards) {
      if (!awardEntityMap.has(sa.award.id)) {
        awardEntityMap.set(sa.award.id, []);
      }
      const existing = awardEntityMap
        .get(sa.award.id)
        ?.find((e) => e.id === subclass.id);
      if (!existing) {
        awardEntityMap.get(sa.award.id)?.push({
          type: "subclass",
          id: subclass.id,
          name: subclass.name,
          awardIds: [sa.award.id],
        });
      }
    }
  }

  for (const school of entities.schools) {
    for (const sa of school.schoolAwards) {
      if (!awardEntityMap.has(sa.award.id)) {
        awardEntityMap.set(sa.award.id, []);
      }
      const existing = awardEntityMap
        .get(sa.award.id)
        ?.find((e) => e.id === school.id);
      if (!existing) {
        awardEntityMap.get(sa.award.id)?.push({
          type: "school",
          id: school.id,
          name: school.name,
          awardIds: [sa.award.id],
        });
      }
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Award Management</h1>
        <p className="text-muted-foreground">
          Create and manage awards, and associate them with content
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create New Award</CardTitle>
          </CardHeader>
          <CardContent>
            <AwardForm onSubmit={createAwardAction} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Award Association</CardTitle>
          </CardHeader>
          <CardContent>
            <AwardAssociationForm
              awards={awards}
              onSubmit={addAwardAssociationAction}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Awards</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Abbreviation</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {awards.map((award) => {
                const awardEntities = awardEntityMap.get(award.id) || [];
                return (
                  <React.Fragment key={award.id}>
                    <TableRow>
                      <TableCell className="font-medium">
                        {award.name}
                      </TableCell>
                      <TableCell>{award.abbreviation}</TableCell>
                      <TableCell>
                        <AwardBadge award={award} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {awardEntities.length}
                      </TableCell>
                      <TableCell>
                        <form action={deleteAwardAction.bind(null, award.id)}>
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </form>
                      </TableCell>
                    </TableRow>
                    {awardEntities.map((entity) => (
                      <TableRow
                        key={`${award.id}-${entity.type}-${entity.id}`}
                        className="bg-muted/30"
                      >
                        <TableCell colSpan={3} className="pl-12 text-sm">
                          <span className="text-muted-foreground capitalize">
                            {entity.type}:
                          </span>{" "}
                          {entity.name}
                        </TableCell>
                        <TableCell />
                        <TableCell>
                          <form
                            action={removeAwardAssociationAction.bind(
                              null,
                              entity.type,
                              entity.id,
                              award.id
                            )}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                            >
                              <Unlink className="size-4" />
                            </Button>
                          </form>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
