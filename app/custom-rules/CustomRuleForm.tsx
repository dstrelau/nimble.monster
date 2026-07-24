"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MultiSelect, type OptionGroup } from "@/components/ui/multi-select";
import { Textarea } from "@/components/ui/textarea";
import type { CustomRule } from "@/lib/db/custom-rule";
import { getCustomRuleUrl } from "@/lib/utils/url";
import { createCustomRuleAction, updateCustomRuleAction } from "./actions";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  rule: Pick<
    CustomRule,
    "id" | "name" | "content" | "visibility" | "sectionSlugs"
  >;
  sectionGroups: OptionGroup[];
  isCreating?: boolean;
}

export function CustomRuleForm({ rule, sectionGroups, isCreating }: Props) {
  const router = useRouter();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(
    rule.sectionSlugs
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule.name,
      content: rule.content,
      visibility: rule.visibility,
    },
  });

  const handleSubmit = async (data: FormData) => {
    const payload = { ...data, sectionSlugs: selectedSlugs };
    const result = isCreating
      ? await createCustomRuleAction(payload)
      : await updateCustomRuleAction(rule.id, payload);

    if (result.success) {
      router.push(getCustomRuleUrl(result.rule));
    } else {
      form.setError("root", { message: result.error });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Rule name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rule text</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your rule..."
                  rows={12}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Supports the same Markdown formatting as the rules reference.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Linked reference sections</FormLabel>
          <MultiSelect
            groups={sectionGroups}
            selected={selectedSlugs}
            onChange={setSelectedSlugs}
            placeholder="Select sections..."
            className="w-full md:w-96"
            popoverClassName="w-96"
          />
          <FormDescription>
            Official rules sections this custom rule relates to.
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Visibility</FormLabel>
              <FormControl>
                <div>
                  <VisibilityToggle
                    id="custom-rule-visibility"
                    checked={field.value === "public"}
                    onCheckedChange={(checked) =>
                      field.onChange(checked ? "public" : "private")
                    }
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-destructive text-sm">
            {form.formState.errors.root.message}
          </p>
        )}

        <div>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {isCreating ? "Create" : "Save"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
