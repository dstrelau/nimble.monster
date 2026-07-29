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

const slugsForRelation = (
  links: CustomRule["links"],
  relation: "replaces" | "augments"
): string[] =>
  links.filter((l) => l.relation === relation).map((l) => l.ruleSlug);

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  rule: Pick<CustomRule, "id" | "name" | "content" | "visibility" | "links">;
  ruleGroups: OptionGroup[];
  isCreating?: boolean;
}

export function CustomRuleForm({ rule, ruleGroups, isCreating }: Props) {
  const router = useRouter();
  const [replacesSlugs, setReplacesSlugs] = useState<string[]>(
    slugsForRelation(rule.links, "replaces")
  );
  const [augmentsSlugs, setAugmentsSlugs] = useState<string[]>(
    slugsForRelation(rule.links, "augments")
  );

  // A rule may appear in only one list. Selecting it in one drops it from
  // the other.
  const handleReplacesChange = (next: string[]) => {
    setReplacesSlugs(next);
    setAugmentsSlugs((prev) => prev.filter((s) => !next.includes(s)));
  };
  const handleAugmentsChange = (next: string[]) => {
    setAugmentsSlugs(next);
    setReplacesSlugs((prev) => prev.filter((s) => !next.includes(s)));
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule.name,
      content: rule.content,
      visibility: rule.visibility,
    },
  });

  const handleSubmit = async (data: FormData) => {
    const links = [
      ...replacesSlugs.map((ruleSlug) => ({
        ruleSlug,
        relation: "replaces" as const,
      })),
      ...augmentsSlugs.map((ruleSlug) => ({
        ruleSlug,
        relation: "augments" as const,
      })),
    ];
    const payload = { ...data, links };
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
          <FormLabel>Replaces</FormLabel>
          <MultiSelect
            groups={ruleGroups}
            selected={replacesSlugs}
            onChange={handleReplacesChange}
            placeholder="Select rules..."
            className="w-full md:w-96"
            popoverClassName="w-96"
          />
          <FormDescription>Official rules this replaces.</FormDescription>
        </FormItem>

        <FormItem>
          <FormLabel>Augments</FormLabel>
          <MultiSelect
            groups={ruleGroups}
            selected={augmentsSlugs}
            onChange={handleAugmentsChange}
            placeholder="Select rules..."
            className="w-full md:w-96"
            popoverClassName="w-96"
          />
          <FormDescription>
            Official rules this adds to or clarifies.
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
