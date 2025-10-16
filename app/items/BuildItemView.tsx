"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/app/ui/item/Card";
import { BuildView } from "@/components/app/BuildView";
import { ExampleLoader } from "@/components/app/ExampleLoader";
import { VisibilityToggle } from "@/components/app/VisibilityToggle";
import { IconPicker } from "@/components/IconPicker";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { listAllSources } from "@/lib/db/source";
import type { Item } from "@/lib/services/items";
import { RARITIES } from "@/lib/services/items";
import { UNKNOWN_USER } from "@/lib/types";
import { getItemUrl } from "@/lib/utils/url";
import { createItem, updateItem } from "../actions/item";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  kind: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  moreInfo: z.string().optional(),
  imageIcon: z.string().optional(),
  imageBgIcon: z.string().optional(),
  imageColor: z.string().optional(),
  imageBgColor: z.string().optional(),
  rarity: z.enum([
    "unspecified",
    "common",
    "uncommon",
    "rare",
    "very_rare",
    "legendary",
  ]),
  visibility: z.enum(["public", "private"]),
  sourceId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const EXAMPLE_ITEMS: Record<string, Omit<Item, "creator">> = {
  Empty: {
    visibility: "public",
    id: "",
    name: "",
    description: "",
    rarity: "unspecified",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "Healing Potion": {
    visibility: "public",
    id: "",
    name: "Greater Healing Potion",
    description:
      "**_ACTION_**. Consume (or administer to an adjacent creature) to heal **3d6+6** HP.",
    imageIcon: "health-potion",
    imageBgIcon: "sparkles",
    imageColor: "rose-200",
    imageBgColor: "red-100",
    rarity: "uncommon",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  "Gem of Escape": {
    visibility: "public",
    id: "",
    name: "Gem of Escape",
    description:
      "**_ACTION_**. Crush one in case of emergency to instantly teleport ALL who are bound to one to the location of the other gem.",
    moreInfo:
      "These magical gems are always crafted in pairs and can have any number of willing creatures magically bound to them.",
    imageIcon: "emerald",
    imageBgIcon: "fire-dash",
    imageColor: "purple-400",
    imageBgColor: "purple-100",
    rarity: "very_rare",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

interface BuildItemViewProps {
  item?: Item;
}

export default function BuildItemView({ item }: BuildItemViewProps) {
  const id = useId();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sourcesQuery = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      return await listAllSources();
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      kind: item?.kind || "",
      description: item?.description || "",
      moreInfo: item?.moreInfo || "",
      imageIcon: item?.imageIcon || "",
      imageBgIcon: item?.imageBgIcon || "",
      imageColor: item?.imageColor || "",
      imageBgColor: item?.imageBgColor || "",
      rarity: item?.rarity || "unspecified",
      visibility: item?.visibility || "public",
      sourceId: item?.source?.id || "",
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  const creator = session?.user || UNKNOWN_USER;
  const previewItem = useMemo<Item>(
    () => ({
      id: item?.id || "",
      name: watchedValues.name || "",
      kind: watchedValues.kind || undefined,
      description: watchedValues.description || "",
      moreInfo: watchedValues.moreInfo || undefined,
      imageIcon: watchedValues.imageIcon || undefined,
      imageBgIcon: watchedValues.imageBgIcon || undefined,
      imageColor: watchedValues.imageColor || undefined,
      imageBgColor: watchedValues.imageBgColor || undefined,
      rarity: watchedValues.rarity,
      visibility: watchedValues.visibility,
      creator: creator,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [
      watchedValues.name,
      watchedValues.kind,
      watchedValues.description,
      watchedValues.moreInfo,
      watchedValues.imageIcon,
      watchedValues.imageBgIcon,
      watchedValues.imageColor,
      watchedValues.imageBgColor,
      watchedValues.rarity,
      watchedValues.visibility,
      creator,
      item?.id,
    ]
  );

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!item?.id;
      const payload = {
        name: data.name.trim(),
        kind: data.kind?.trim() || undefined,
        description: data.description.trim(),
        moreInfo: data.moreInfo?.trim() || undefined,
        imageIcon: data.imageIcon || undefined,
        imageBgIcon: data.imageBgIcon,
        imageColor: data.imageColor,
        imageBgColor: data.imageBgColor,
        rarity: data.rarity,
        visibility: data.visibility,
        sourceId: data.sourceId || undefined,
      };
      const result = isEditing
        ? await updateItem(item.id, payload)
        : await createItem(payload);

      if (result.success && result.item) {
        router.push(getItemUrl(result.item));
      } else {
        form.setError("root", {
          message:
            result.error || `Failed to ${isEditing ? "update" : "create"} item`,
        });
      }
    } catch (error) {
      form.setError("root", {
        message: `Error ${item?.id ? "updating" : "creating"} item: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadExample = (exampleKey: string) => {
    const example = EXAMPLE_ITEMS[exampleKey];
    if (example) {
      form.reset({
        name: example.name,
        kind: example.kind || "",
        description: example.description,
        moreInfo: example.moreInfo || "",
        imageIcon: example.imageIcon || "",
        imageBgIcon: example.imageBgIcon || "",
        imageColor: example.imageColor || "",
        imageBgColor: example.imageBgColor || "",
        rarity: example.rarity || "unspecified",
        visibility: example.visibility,
      });
    }
  };

  return (
    <BuildView
      entityName={watchedValues.name || (item?.id ? "Edit Item" : "New Item")}
      previewTitle="Item Preview"
      formClassName="md:col-span-4"
      previewClassName="md:col-span-2"
      formContent={
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rarity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rarity</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rarity" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RARITIES.map((rarity) => (
                          <SelectItem key={rarity.value} value={rarity.value}>
                            {rarity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kind"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Kind</FormLabel>
                    <FormControl>
                      <Input placeholder="Kind" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="moreInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>More Info</FormLabel>
                  <FormControl>
                    <Textarea placeholder="More Info (optional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="imageIcon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <IconPicker
                        selectedIcon={field.value || undefined}
                        selectedColor={watchedValues.imageColor || undefined}
                        onIconSelect={(iconId) => field.onChange(iconId || "")}
                        onColorSelect={(color) =>
                          form.setValue("imageColor", color || "")
                        }
                        showColorPicker={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="imageBgIcon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Background Icon</FormLabel>
                    <FormControl>
                      <IconPicker
                        selectedIcon={field.value || undefined}
                        selectedColor={watchedValues.imageBgColor || undefined}
                        onIconSelect={(iconId) => field.onChange(iconId || "")}
                        onColorSelect={(color) =>
                          form.setValue("imageBgColor", color || "")
                        }
                        showColorPicker={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {sourcesQuery.data && sourcesQuery.data.length > 0 && (
              <FormField
                control={form.control}
                name="sourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {sourcesQuery.data.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name} ({source.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {session?.user && (
              <div className="flex flex-row justify-between items-center my-4">
                <div className="flex flex-col gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : item?.id ? "Update" : "Save"}
                  </Button>
                </div>
                <fieldset className="space-y-2">
                  <FormField
                    control={form.control}
                    name="visibility"
                    render={({ field }) => (
                      <VisibilityToggle
                        id={`item-visibility-toggle-${id}`}
                        checked={field.value === "public"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "public" : "private")
                        }
                        entityType="Item"
                      />
                    )}
                  />
                </fieldset>
              </div>
            )}
            {form.formState.errors.root && (
              <div className="text-destructive text-sm">
                {form.formState.errors.root.message}
              </div>
            )}
          </form>
        </Form>
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
