"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Card } from "@/app/ui/item/Card";
import { BuildView } from "@/components/app/BuildView";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import { FormInput, FormTextarea } from "@/components/app/Form";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { IconPicker } from "@/components/IconPicker";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Item, User } from "@/lib/types";
import { createItem, updateItem } from "../actions/item";

const EXAMPLE_ITEMS: Record<string, Item> = {
  Empty: {
    visibility: "public",
    id: "",
    name: "",
    description: "",
    updatedAt: "",
  },
  "Healing Potion": {
    visibility: "public",
    id: "",
    name: "Greater Healing Potion",
    description:
      "*_ACTION_*. Consume (or administer to an adjacent creature) to heal *3d6+6* HP.",
    imageIcon: "health-potion",
    updatedAt: "",
  },
  "Gem of Escape": {
    visibility: "public",
    id: "",
    name: "Gem of Escape",
    description:
      "*_ACTION_*. Crush one in case of emergency to instantly teleport AL who are bound to one to the location of the other gem.",
    moreInfo:
      "These magical gems are always crafted in pairs and can have any number of willing creatures magically bound to them.",
    imageIcon: "emerald",
    updatedAt: "",
  },
};

interface BuildItemViewProps {
  item?: Item;
}

export default function BuildItemView({ item }: BuildItemViewProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const [name, setName] = useState(item?.name || "");
  const [kind, setKind] = useState(item?.kind || "");
  const [description, setDescription] = useState(item?.description || "");
  const [moreInfo, setMoreInfo] = useState(item?.moreInfo || "");
  const [imageIcon, setImageIcon] = useState(item?.imageIcon || "");
  const [visibility, setVisibility] = useState<"public" | "private">(
    item?.visibility || "public"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  let creator: User | undefined;
  if (session?.user) {
    creator = {
      discordId: session.user.id,
      avatar: session.user.image || "",
      username: session.user.name || "",
    };
  }
  const previewItem = useMemo<Item>(
    () => ({
      id: item?.id || "",
      name,
      kind: kind || undefined,
      description,
      moreInfo: moreInfo || undefined,
      imageIcon: imageIcon || undefined,
      visibility,
      creator: creator,
      updatedAt: new Date().toISOString(),
    }),
    [
      name,
      kind,
      description,
      moreInfo,
      imageIcon,
      visibility,
      creator,
      item?.id,
    ]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const isEditing = !!item?.id;
      const result = isEditing
        ? await updateItem(item.id, {
            name: name.trim(),
            kind: kind.trim() || undefined,
            description: description.trim(),
            moreInfo: moreInfo.trim() || undefined,
            imageIcon: imageIcon || undefined,
            visibility,
          })
        : await createItem({
            name: name.trim(),
            kind: kind.trim() || undefined,
            description: description.trim(),
            moreInfo: moreInfo.trim() || undefined,
            imageIcon: imageIcon || undefined,
            visibility,
          });

      if (result.success && result.item) {
        router.push(`/items/${result.item.id}`);
      } else {
        console.error(
          `Failed to ${isEditing ? "update" : "create"} item:`,
          result.error
        );
      }
    } catch (error) {
      console.error(`Error ${item?.id ? "updating" : "creating"} item:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExample = (exampleKey: string) => {
    const example = EXAMPLE_ITEMS[exampleKey];
    if (example) {
      setName(example.name);
      setKind(example.kind || "");
      setDescription(example.description);
      setMoreInfo(example.moreInfo || "");
      setImageIcon(example.imageIcon || "");
      setVisibility(example.visibility);
    }
  };

  return (
    <BuildView
      showMobilePreview={showMobilePreview}
      setShowMobilePreview={setShowMobilePreview}
      entityName={name || (item?.id ? "Edit Item" : "New Item")}
      previewTitle="Item Preview"
      formClassName="md:col-span-4"
      previewClassName="md:col-span-2"
      formContent={
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <FormInput
              label="Name"
              name="name"
              value={name}
              onChange={setName}
              className="flex-1"
            />

            <FormInput
              label="Kind"
              name="kind"
              value={kind}
              onChange={setKind}
              className="flex-1"
            />
          </div>

          <FormTextarea
            label="Description"
            name="description"
            value={description}
            onChange={setDescription}
          />

          <FormTextarea
            label="More Info"
            name="moreInfo"
            value={moreInfo}
            onChange={setMoreInfo}
          />

          <div className="space-y-2">
            <Label className="">Icon</Label>
            <IconPicker
              selectedIcon={imageIcon || undefined}
              onIconSelect={(iconId) => setImageIcon(iconId || "")}
            />
          </div>

          {session?.user && (
            <div className="flex flex-row justify-between items-center my-4">
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={!name.trim() || !description.trim() || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : item?.id ? "Update" : "Save"}
                </Button>
              </div>
              <fieldset className="space-y-2">
                <div>
                  <VisibilityToggle
                    id="item-visibility-toggle"
                    checked={visibility === "public"}
                    onCheckedChange={(checked) =>
                      setVisibility(checked ? "public" : "private")
                    }
                    entityType="Item"
                  />
                </div>
              </fieldset>
            </div>
          )}
        </form>
      }
      previewContent={
        <Card item={previewItem} creator={creator} link={false} hideActions />
      }
      desktopPreviewContent={
        <>
          <ExampleLoader examples={EXAMPLE_ITEMS} onLoadExample={loadExample} />
          <div className="overflow-auto max-h-[calc(100vh-120px)] px-4">
            <Card
              item={previewItem}
              creator={creator}
              link={false}
              hideActions
            />
          </div>
        </>
      }
    />
  );
}
