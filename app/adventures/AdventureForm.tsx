"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  ListTree,
  MessageSquareWarning,
  Plus,
  Shield,
  Swords,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SelectableItemGrid } from "@/app/collections/SelectableItemGrid";
import {
  ADVENTURE_SECTION_COLORS,
  AdventureOutline,
  type AdventureOutlineNode,
  getAdventureNodeAnchorId,
} from "@/components/adventure/AdventureOutline";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { Goblin } from "@/components/icons/goblin";
import { SelectableMonsterGrid } from "@/components/monster/SelectableMonsterGrid";
import { ExampleLoader } from "@/components/shared/ExampleLoader";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { call } from "@/lib/contract";
import { createAdventure, updateAdventure } from "@/lib/contracts/adventure";
import type {
  Adventure,
  AdventureInput,
  AdventureNodeInput,
  AdventureStatblock,
} from "@/lib/db/adventures";
import type {
  AdventureNodeKind,
  AdventureNodePresentation,
} from "@/lib/db/schema";
import type { Item } from "@/lib/services/items";
import type { BestiaryEntry } from "@/lib/services/monsters";
import type { EncounterOverview, User } from "@/lib/types";
import { cn, randomUUID } from "@/lib/utils";
import { getAdventureUrl } from "@/lib/utils/url";
import { AdventureView } from "./AdventureView";
import { getExampleAdventures } from "./exampleAdventures";

interface AdventureFormProps {
  adventureId?: string;
  initialValue: AdventureInput;
  encounters: EncounterOverview[];
  creator: User;
  initialStatblocks?: AdventureStatblock[];
  initialRemovedNodeIds?: string[];
}

function formDraft(
  input: AdventureInput,
  regenerateIds: boolean
): AdventureInput {
  const ids = new Map(
    input.nodes.map((node) => [node.id, regenerateIds ? randomUUID() : node.id])
  );
  return {
    ...input,
    nodes: input.nodes.map((node) => ({
      ...node,
      id: ids.get(node.id) ?? randomUUID(),
      parentId: node.parentId ? (ids.get(node.parentId) ?? null) : null,
    })),
  };
}

function emptyNode(
  parentId: string | null,
  orderIndex: number
): AdventureNodeInput {
  return {
    id: randomUUID(),
    parentId,
    kind: "section",
    orderIndex,
    title: "",
    content: "",
    encounterId: null,
    monsterId: null,
    itemId: null,
    presentation: null,
  };
}

function normalizeOrder(nodes: AdventureNodeInput[]): AdventureNodeInput[] {
  const byParent = new Map<string | null, AdventureNodeInput[]>();
  for (const node of nodes) {
    const siblings = byParent.get(node.parentId) ?? [];
    siblings.push(node);
    byParent.set(node.parentId, siblings);
  }
  return nodes.map((node) => {
    const siblings = (byParent.get(node.parentId) ?? []).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const isReference = node.kind === "encounter" || node.kind === "statblock";
    return {
      ...node,
      orderIndex: siblings.findIndex((item) => item.id === node.id),
      title: isReference ? "" : node.title,
      content: isReference ? "" : node.content,
    };
  });
}

export function AdventureForm({
  adventureId,
  initialValue,
  encounters,
  creator,
  initialStatblocks = [],
  initialRemovedNodeIds = [],
}: AdventureFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<AdventureInput>(() =>
    formDraft(initialValue, false)
  );
  const [showPreview, setShowPreview] = useState(false);
  const [statblockPickerNodeId, setStatblockPickerNodeId] = useState<
    string | null
  >(null);
  const [statblocks, setStatblocks] = useState(
    () =>
      new Map(
        initialStatblocks.map(
          (statblock) =>
            [statblock.entity.id, statblock] satisfies [
              string,
              AdventureStatblock,
            ]
        )
      )
  );
  const [removedNodeIds, setRemovedNodeIds] = useState(
    () => new Set(initialRemovedNodeIds)
  );
  const [error, setError] = useState<string | null>(null);
  const saveMutation = useMutation({
    mutationFn: (input: AdventureInput) =>
      adventureId
        ? call(updateAdventure, { id: adventureId, adventure: input })
        : call(createAdventure, input),
    onSuccess: (adventure) => {
      router.push(getAdventureUrl(adventure));
    },
    onError: (saveError) => {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save adventure"
      );
    },
    meta: { suppressErrorToast: true },
  });
  const examples = getExampleAdventures(
    encounters.filter((encounter) => encounter.visibility === "public")
  );
  const availableEncounters = encounters.filter(
    (encounter) =>
      draft.visibility === "private" || encounter.visibility === "public"
  );

  const updateNode = (id: string, patch: Partial<AdventureNodeInput>) => {
    setDraft((current) => ({
      ...current,
      nodes: current.nodes.map((node) =>
        node.id === id ? { ...node, ...patch } : node
      ),
    }));
  };

  const addNode = (parentId: string | null) => {
    setDraft((current) => {
      const orderIndex = current.nodes.filter(
        (node) => node.parentId === parentId
      ).length;
      return {
        ...current,
        nodes: [...current.nodes, emptyNode(parentId, orderIndex)],
      };
    });
  };

  const selectMonsterStatblock = (nodeId: string, entity: BestiaryEntry) => {
    const statblock = {
      entityType: "monster",
      entity,
    } satisfies AdventureStatblock;
    setStatblocks((current) => new Map(current).set(entity.id, statblock));
    setRemovedNodeIds((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
    updateNode(nodeId, { monsterId: entity.id, itemId: null });
    setStatblockPickerNodeId(null);
  };

  const selectItemStatblock = (nodeId: string, entity: Item) => {
    const statblock = {
      entityType: "item",
      entity,
    } satisfies AdventureStatblock;
    setStatblocks((current) => new Map(current).set(entity.id, statblock));
    setRemovedNodeIds((current) => {
      const next = new Set(current);
      next.delete(nodeId);
      return next;
    });
    updateNode(nodeId, { monsterId: null, itemId: entity.id });
    setStatblockPickerNodeId(null);
  };

  const removeNode = (id: string) => {
    setDraft((current) => {
      const removed = new Set([id]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const node of current.nodes) {
          if (
            node.parentId &&
            removed.has(node.parentId) &&
            !removed.has(node.id)
          ) {
            removed.add(node.id);
            changed = true;
          }
        }
      }
      return {
        ...current,
        nodes: normalizeOrder(
          current.nodes.filter((node) => !removed.has(node.id))
        ),
      };
    });
  };

  const moveNode = (id: string, direction: -1 | 1) => {
    setDraft((current) => {
      const target = current.nodes.find((node) => node.id === id);
      if (!target) return current;
      const siblings = current.nodes
        .filter((node) => node.parentId === target.parentId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      const index = siblings.findIndex((node) => node.id === id);
      const swap = siblings[index + direction];
      if (!swap) return current;
      return {
        ...current,
        nodes: current.nodes.map((node) => {
          if (node.id === target.id)
            return { ...node, orderIndex: swap.orderIndex };
          if (node.id === swap.id)
            return { ...node, orderIndex: target.orderIndex };
          return node;
        }),
      };
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload: AdventureInput = {
      ...draft,
      nodes: normalizeOrder(draft.nodes),
    };
    saveMutation.mutate(payload);
  };

  const previewAdventure: Pick<
    Adventure,
    "name" | "tagline" | "summary" | "creator" | "nodes"
  > = {
    name: draft.name,
    tagline: draft.tagline,
    summary: draft.summary,
    creator,
    nodes: draft.nodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      kind: node.kind,
      orderIndex: node.orderIndex,
      title: node.title,
      content: node.content,
      presentation: node.presentation,
      encounter:
        encounters.find((encounter) => encounter.id === node.encounterId) ??
        null,
      statblock: node.monsterId
        ? (statblocks.get(node.monsterId) ?? null)
        : node.itemId
          ? (statblocks.get(node.itemId) ?? null)
          : null,
      referenceRemoved: removedNodeIds.has(node.id),
    })),
  };

  const renderNode = (node: AdventureNodeInput, depth: number) => {
    const siblings = draft.nodes
      .filter((candidate) => candidate.parentId === node.parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const children = draft.nodes
      .filter((candidate) => candidate.parentId === node.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const siblingIndex = siblings.findIndex(
      (candidate) => candidate.id === node.id
    );

    return (
      <div
        key={node.id}
        id={getAdventureNodeAnchorId(node.id)}
        className={cn(
          depth > 0
            ? "ml-2 border-l pl-3 sm:ml-4 sm:pl-4"
            : "border-b border-l-4 pb-5 pl-3 last:border-b-0 sm:pl-4",
          depth === 0 &&
            ADVENTURE_SECTION_COLORS[
              siblingIndex % ADVENTURE_SECTION_COLORS.length
            ].border
        )}
      >
        <div className="space-y-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={node.kind}
              onValueChange={(kind: AdventureNodeKind) => {
                const isReference =
                  kind === "encounter" || kind === "statblock";
                updateNode(node.id, {
                  kind,
                  title: isReference ? "" : node.title,
                  content: isReference ? "" : node.content,
                  encounterId: kind === "encounter" ? node.encounterId : null,
                  monsterId: kind === "statblock" ? node.monsterId : null,
                  itemId: kind === "statblock" ? node.itemId : null,
                  presentation: kind === "callout" ? "note" : null,
                });
                setRemovedNodeIds((current) => {
                  const next = new Set(current);
                  next.delete(node.id);
                  return next;
                });
              }}
            >
              <SelectTrigger
                id={`kind-${node.id}`}
                className="w-40 shrink-0"
                aria-label="Section type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="section">
                  <ListTree />
                  Section
                </SelectItem>
                <SelectItem value="text" disabled={children.length > 0}>
                  <AlignLeft />
                  Text
                </SelectItem>
                <SelectItem value="callout" disabled={children.length > 0}>
                  <MessageSquareWarning />
                  Callout
                </SelectItem>
                <SelectItem value="encounter" disabled={children.length > 0}>
                  <Swords />
                  Encounter
                </SelectItem>
                <SelectItem value="statblock" disabled={children.length > 0}>
                  <BookOpen />
                  Statblock
                </SelectItem>
              </SelectContent>
            </Select>
            {node.kind !== "text" &&
              node.kind !== "encounter" &&
              node.kind !== "statblock" && (
                <div className="min-w-48 flex-1">
                  <Label htmlFor={`title-${node.id}`} className="sr-only">
                    Title
                  </Label>
                  <Input
                    id={`title-${node.id}`}
                    value={node.title}
                    required={node.kind === "section"}
                    placeholder="Title"
                    onChange={(event) =>
                      updateNode(node.id, { title: event.target.value })
                    }
                  />
                </div>
              )}
            <div className="ml-auto flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={siblingIndex === 0}
                onClick={() => moveNode(node.id, -1)}
                aria-label="Move section up"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={siblingIndex === siblings.length - 1}
                onClick={() => moveNode(node.id, 1)}
                aria-label="Move section down"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeNode(node.id)}
                aria-label="Remove section"
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            {node.kind === "callout" && (
              <div className="space-y-2">
                <Label htmlFor={`presentation-${node.id}`}>Callout style</Label>
                <Select
                  value={node.presentation ?? "note"}
                  onValueChange={(presentation: AdventureNodePresentation) =>
                    updateNode(node.id, { presentation })
                  }
                >
                  <SelectTrigger
                    id={`presentation-${node.id}`}
                    className="w-full"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="tip">Tip</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="rules">Rules</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {node.kind === "encounter" && (
              <div className="space-y-2">
                <Label htmlFor={`encounter-${node.id}`}>Encounter</Label>
                {removedNodeIds.has(node.id) && (
                  <div className="rounded-md border border-dashed p-3 text-muted-foreground">
                    Removed content
                  </div>
                )}
                <Select
                  value={node.encounterId ?? "none"}
                  onValueChange={(encounterId) => {
                    updateNode(node.id, {
                      encounterId: encounterId === "none" ? null : encounterId,
                    });
                    setRemovedNodeIds((current) => {
                      const next = new Set(current);
                      next.delete(node.id);
                      return next;
                    });
                  }}
                >
                  <SelectTrigger id={`encounter-${node.id}`} className="w-full">
                    <SelectValue placeholder="Select an encounter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select an encounter</SelectItem>
                    {availableEncounters.map((encounter) => (
                      <SelectItem key={encounter.id} value={encounter.id}>
                        {encounter.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {node.kind === "statblock" && (
              <div className="space-y-2">
                <Label>Statblock</Label>
                <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
                  <span className="min-w-0 flex-1">
                    {removedNodeIds.has(node.id)
                      ? "Removed content"
                      : node.monsterId || node.itemId
                        ? (statblocks.get(node.monsterId ?? node.itemId ?? "")
                            ?.entity.name ?? "Selected statblock")
                        : "No statblock selected"}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatblockPickerNodeId(node.id)}
                  >
                    {node.monsterId || node.itemId ? "Change" : "Select"}
                  </Button>
                </div>
                <Dialog
                  open={statblockPickerNodeId === node.id}
                  onOpenChange={(open) =>
                    setStatblockPickerNodeId(open ? node.id : null)
                  }
                >
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-6xl">
                    <DialogHeader>
                      <DialogTitle>Select a statblock</DialogTitle>
                      <DialogDescription>
                        Choose one monster, hazard, or item to display in this
                        adventure.
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="monsters">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monsters">
                          <Goblin />
                          Monsters & hazards
                        </TabsTrigger>
                        <TabsTrigger value="items">
                          <Shield />
                          Items
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="monsters" className="pt-4">
                        <SelectableMonsterGrid
                          compact
                          publicOnly={draft.visibility === "public"}
                          selectedIds={
                            new Set(node.monsterId ? [node.monsterId] : [])
                          }
                          onToggle={(entity) =>
                            selectMonsterStatblock(node.id, entity)
                          }
                        />
                      </TabsContent>
                      <TabsContent value="items" className="pt-4">
                        <SelectableItemGrid
                          publicOnly={draft.visibility === "public"}
                          selectedIds={
                            new Set(node.itemId ? [node.itemId] : [])
                          }
                          onToggle={(entity) =>
                            selectItemStatblock(node.id, entity)
                          }
                        />
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {node.kind !== "encounter" && node.kind !== "statblock" && (
              <div className="space-y-2">
                <Textarea
                  id={`content-${node.id}`}
                  aria-label={`${node.kind} content`}
                  rows={6}
                  value={node.content}
                  onChange={(event) =>
                    updateNode(node.id, { content: event.target.value })
                  }
                />
              </div>
            )}

            {node.kind === "section" && depth < 2 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addNode(node.id)}
              >
                <Plus />
                Add child
              </Button>
            )}
          </div>
        </div>
        {children.length > 0 && (
          <div className="mt-2 space-y-2">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const roots = draft.nodes
    .filter((node) => node.parentId === null)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const outlineNodes: AdventureOutlineNode[] = draft.nodes.map((node) => ({
    id: node.id,
    parentId: node.parentId,
    orderIndex: node.orderIndex,
    label:
      (node.kind === "encounter" && node.encounterId
        ? encounters.find((encounter) => encounter.id === node.encounterId)
            ?.name
        : undefined) ||
      (node.kind === "statblock" && (node.monsterId || node.itemId)
        ? statblocks.get(node.monsterId ?? node.itemId ?? "")?.entity.name
        : undefined) ||
      node.title.trim() ||
      `${node.kind.charAt(0).toUpperCase()}${node.kind.slice(1)}`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Toggle
          className="lg:hidden"
          type="button"
          variant="outline"
          pressed={showPreview}
          onPressedChange={setShowPreview}
          aria-label="Toggle preview"
        >
          <Eye />
          Preview
        </Toggle>
        {!showPreview && !adventureId && (
          <ExampleLoader
            examples={examples}
            onLoadExample={(key) => {
              const example = examples[key];
              if (example) {
                setDraft(formDraft(example, true));
                setRemovedNodeIds(new Set());
              }
            }}
            className="mb-0 mr-0"
          />
        )}
      </div>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-3">
            <Toggle
              type="button"
              variant="outline"
              pressed={showPreview}
              onPressedChange={setShowPreview}
              aria-label="Toggle preview"
            >
              <Eye />
              Preview
            </Toggle>
            <AdventureOutline nodes={outlineNodes} className="mt-4" />
          </div>
        </aside>
        <div className="min-w-0">
          {showPreview ? (
            <div className="mx-auto w-full max-w-5xl rounded-xl border bg-card px-6 py-10 sm:px-10">
              <AdventureView adventure={previewAdventure} />
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Adventure details</CardTitle>
                  <CardDescription>
                    Information shown in the adventure header and search
                    results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="adventure-name">Name</Label>
                    <Input
                      id="adventure-name"
                      required
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adventure-tagline">Tagline</Label>
                    <Input
                      id="adventure-tagline"
                      value={draft.tagline}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          tagline: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adventure-summary">Summary</Label>
                    <Textarea
                      id="adventure-summary"
                      rows={3}
                      value={draft.summary}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          summary: event.target.value,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">Adventure content</h2>
                    <p className="text-sm text-muted-foreground">
                      Most text boxes support site formatting{" "}
                      <span className="inline-flex align-middle">
                        <ConditionValidationIcon />
                      </span>
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addNode(null)}
                  >
                    <Plus />
                    Add section
                  </Button>
                </div>
                {roots.length > 0 ? (
                  <div className="space-y-4">
                    {roots.map((node) => renderNode(node, 0))}
                  </div>
                ) : (
                  <Card className="border-dashed shadow-none">
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Add a section to begin writing the adventure.
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t pt-6">
                <VisibilityToggle
                  id="adventure-visibility"
                  checked={draft.visibility === "public"}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const hasPrivateContent = draft.nodes.some((node) => {
                        const encounter = node.encounterId
                          ? encounters.find(
                              (candidate) => candidate.id === node.encounterId
                            )
                          : undefined;
                        const statblock = statblocks.get(
                          node.monsterId ?? node.itemId ?? ""
                        );
                        return (
                          encounter?.visibility === "private" ||
                          statblock?.entity.visibility === "private"
                        );
                      });
                      if (hasPrivateContent) {
                        setError(
                          "Remove private encounters and statblocks before making this adventure public."
                        );
                        return;
                      }
                    }
                    setError(null);
                    setDraft((current) => ({
                      ...current,
                      visibility: checked ? "public" : "private",
                    }));
                  }}
                />
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? "Saving..."
                    : adventureId
                      ? "Save"
                      : "Create"}
                </Button>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
