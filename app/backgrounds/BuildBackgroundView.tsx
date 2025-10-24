"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card } from "@/app/ui/background/Card";
import { SourceSelect } from "@/app/ui/create/SourceSelect";
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
import { Textarea } from "@/components/ui/textarea";
import type { Background } from "@/lib/services/backgrounds";
import { UNKNOWN_USER } from "@/lib/types";
import { getBackgroundUrl } from "@/lib/utils/url";
import { createBackground, updateBackground } from "../actions/background";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  requirement: z.string().optional(),
  sourceId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface BuildBackgroundViewProps {
  background?: Background;
}

export default function BuildBackgroundView({
  background,
}: BuildBackgroundViewProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: background?.name || "",
      description: background?.description || "",
      requirement: background?.requirement || "",
      sourceId: background?.source?.id || "",
    },
  });

  const { watch } = form;
  const watchedValues = watch();

  const creator = session?.user || UNKNOWN_USER;
  const previewBackground = useMemo<Background>(
    () => ({
      id: background?.id || "",
      name: watchedValues.name || "",
      description: watchedValues.description || "",
      requirement: watchedValues.requirement || undefined,
      creator: creator,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [
      watchedValues.name,
      watchedValues.description,
      watchedValues.requirement,
      creator,
      background?.id,
    ]
  );

  const handleSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const isEditing = !!background?.id;
      const payload = {
        name: data.name.trim(),
        description: data.description.trim(),
        requirement: data.requirement?.trim() || undefined,
        sourceId:
          data.sourceId && data.sourceId !== "none" ? data.sourceId : undefined,
      };
      const result = isEditing
        ? await updateBackground(background.id, payload)
        : await createBackground(payload);

      if (result.success && result.background) {
        router.push(getBackgroundUrl(result.background));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BuildView
      entityName={
        watchedValues.name ||
        (background?.id ? "Edit Background" : "New Background")
      }
      previewTitle="Background Preview"
      previewContent={<Card background={previewBackground} />}
      desktopPreviewContent={<Card background={previewBackground} />}
      formClassName="col-span-6 md:col-span-4"
      previewClassName="hidden md:block md:col-span-2"
      formContent={
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
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
                    <FormLabel className="flex items-center gap-2">
                      Description
                      <ConditionValidationIcon text={field.value} />
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sourceId"
                render={({ field }) => (
                  <FormItem>
                    <SourceSelect
                      source={field.value ? { id: field.value } : undefined}
                      onChange={(source) => field.onChange(source?.id || "")}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {session?.user && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Saving..."
                    : background
                      ? "Update"
                      : "Create"}
                </Button>
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
    />
  );
}
