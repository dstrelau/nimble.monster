"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import React, { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { BuildView } from "@/components/app/BuildView";
import { DiscordLoginButton } from "@/components/app/DiscordLoginButton";
import { ConditionValidationIcon } from "@/components/ConditionValidationIcon";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import type { ClassAbilityList, SubclassClass } from "@/lib/types";
import { SUBCLASS_CLASSES, UNKNOWN_USER } from "@/lib/types";
import { getClassAbilityListUrl } from "@/lib/utils/url";
import {
  createClassAbilityList,
  updateClassAbilityList,
} from "../actions/classAbilityList";
import { AbilityListCard } from "../ui/class-options/AbilityListCard";

const abilityItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Option name is required"),
  description: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  characterClass: z
    .enum(
      SUBCLASS_CLASSES.map((cls) => cls.value) as [
        SubclassClass,
        ...SubclassClass[],
      ]
    )
    .optional(),
  items: z.array(abilityItemSchema).min(1, "At least one option is required"),
});

type FormData = z.infer<typeof formSchema>;

interface BuildClassAbilityListViewProps {
  list?: ClassAbilityList;
}

export default function BuildClassAbilityListView({
  list,
}: BuildClassAbilityListViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: list?.name || "",
      description: list?.description || "",
      characterClass: list?.characterClass || undefined,
      items: list?.items || [
        { id: crypto.randomUUID(), name: "", description: "" },
      ],
    },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!list?.id;

      const payload = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        characterClass: data.characterClass,
        items: data.items.map((item) => ({
          name: item.name.trim(),
          description: item.description?.trim() || "",
        })),
      };

      const result = isEditing
        ? await updateClassAbilityList(list.id, {
            ...payload,
            items: data.items.map((item) => ({
              id: item.id,
              name: item.name,
              description: item.description || "",
            })),
          })
        : await createClassAbilityList(payload);

      if (result.success && result.list) {
        router.push(getClassAbilityListUrl(result.list));
      } else {
        form.setError("root", {
          message:
            result.error || `Failed to ${isEditing ? "update" : "create"} list`,
        });
      }
    } catch (error) {
      form.setError("root", {
        message: `Error ${list?.id ? "updating" : "creating"} list: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchedValues = form.watch();

  const creator = session?.user || UNKNOWN_USER;
  const previewAbilityList = useMemo<ClassAbilityList>(
    () => ({
      id: list?.id || "",
      name: watchedValues.name || "",
      description: watchedValues.description || "",
      characterClass: watchedValues.characterClass,
      items: (watchedValues.items || []).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description || "",
      })),
      creator,
      createdAt: list?.createdAt || new Date(),
      updatedAt: new Date(),
    }),
    [watchedValues, creator, list?.id, list?.createdAt]
  );

  return (
    <BuildView
      entityName={
        watchedValues.name || (list?.id ? "Edit Options" : "New Class Options")
      }
      previewTitle="Preview"
      formClassName="md:col-span-3"
      previewClassName="md:col-span-3"
      formContent={
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Description
                      <ConditionValidationIcon text={field.value} />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="characterClass"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Class</FormLabel>
                    <Select
                      onValueChange={(v) =>
                        field.onChange(v === "none" ? undefined : v)
                      }
                      value={field.value ?? "none"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Any class</SelectItem>
                        {SUBCLASS_CLASSES.map((classOption) => (
                          <SelectItem
                            key={classOption.value}
                            value={classOption.value}
                          >
                            {classOption.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Options</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      appendItem({
                        id: crypto.randomUUID(),
                        name: "",
                        description: "",
                      })
                    }
                  >
                    <Plus className="size-4" />
                    Add Option
                  </Button>
                </div>
                <div className="pl-3 space-y-4">
                  {itemFields.map((itemField, itemIndex) => (
                    <React.Fragment key={itemField.id}>
                      {itemIndex > 0 && <Separator />}
                      <div className="flex gap-2 items-end justify-between">
                        <FormField
                          control={form.control}
                          name={`items.${itemIndex}.name`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {itemFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(itemIndex)}
                            className="mb-0.5"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <FormField
                        control={form.control}
                        name={`items.${itemIndex}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Description
                              <ConditionValidationIcon text={field.value} />
                            </FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mt-10 flex flex-row justify-between items-center my-4">
                <div className="flex items-center gap-2">
                  {session?.user.id && (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting
                        ? "Saving..."
                        : list?.id
                          ? "Update"
                          : "Save"}
                    </Button>
                  )}
                </div>
              </div>
              {form.formState.errors.root && (
                <div className="text-destructive text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}
            </form>
          </Form>
          {!session?.user && (
            <div className="flex items-center gap-2 py-4">
              <DiscordLoginButton className="px-2 py-1" />
              {" to save"}
            </div>
          )}
        </>
      }
      previewContent={<AbilityListCard abilityList={previewAbilityList} />}
      desktopPreviewContent={
        <AbilityListCard abilityList={previewAbilityList} />
      }
    />
  );
}
