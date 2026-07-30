"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ConditionValidationIcon } from "@/components/condition/ConditionValidationIcon";
import { VisibilityToggle } from "@/components/shared/VisibilityToggle";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  type ComboboxGroup,
  type ComboboxItem,
} from "@/components/ui/combobox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import type {
  CustomRule,
  CustomRuleLink,
  CustomRuleRelation,
} from "@/lib/db/custom-rule";
import { randomUUID } from "@/lib/utils";
import { getCustomRuleUrl } from "@/lib/utils/url";
import { createCustomRuleAction, updateCustomRuleAction } from "./actions";
import { CustomRuleBody } from "./CustomRuleBody";

interface RuleLinkRow extends CustomRuleLink {
  id: string;
}

const newRuleLinkRow = (): RuleLinkRow => ({
  id: randomUUID(),
  relation: "augments",
  ruleSlug: "",
});

const ruleLinkRows = (links: CustomRule["links"]): RuleLinkRow[] =>
  links.length > 0
    ? links.map((link) => ({ ...link, id: randomUUID() }))
    : [newRuleLinkRow()];

const isCustomRuleRelation = (value: string): value is CustomRuleRelation =>
  value === "augments" || value === "replaces";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string(),
  keywords: z.string(),
  visibility: z.enum(["public", "private"]),
});

type FormData = z.infer<typeof formSchema>;

interface Props {
  rule: Pick<
    CustomRule,
    "id" | "name" | "content" | "keywords" | "visibility" | "links"
  >;
  ruleGroups: ComboboxGroup<ComboboxItem>[];
  creatorDiscordId: string;
  isCreating?: boolean;
}

export function CustomRuleForm({
  rule,
  ruleGroups,
  creatorDiscordId,
  isCreating,
}: Props) {
  const router = useRouter();
  const [links, setLinks] = useState<RuleLinkRow[]>(() =>
    ruleLinkRows(rule.links)
  );
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: rule.name,
      content: rule.content,
      keywords: rule.keywords,
      visibility: rule.visibility,
    },
  });
  const previewName = form.getValues("name");
  const previewContent = form.getValues("content");

  const updateRelation = (id: string, relation: string) => {
    if (!isCustomRuleRelation(relation)) return;
    setLinks((current) =>
      current.map((link) => (link.id === id ? { ...link, relation } : link))
    );
  };

  const updateRuleSlug = (id: string, ruleSlug: string) => {
    setLinks((current) =>
      current.map((link) => {
        if (link.id === id) return { ...link, ruleSlug };
        return link.ruleSlug === ruleSlug ? { ...link, ruleSlug: "" } : link;
      })
    );
  };

  const removeLink = (id: string) => {
    setLinks((current) => {
      const next = current.filter((link) => link.id !== id);
      return next.length > 0 ? next : [newRuleLinkRow()];
    });
  };

  const handleSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      links: links
        .filter((link) => link.ruleSlug)
        .map(({ ruleSlug, relation }) => ({ ruleSlug, relation })),
    };
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
      <div className="mb-6 flex justify-end">
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
      </div>
      {showPreview ? (
        <section className="min-h-64 rounded-lg border bg-card p-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <h2 className="mb-5 text-3xl font-bold">
            {previewName.trim() || "Untitled rule"}
          </h2>
          {previewContent.trim() ? (
            <CustomRuleBody
              content={previewContent}
              creatorDiscordId={creatorDiscordId}
            />
          ) : (
            <p className="text-muted-foreground">
              Add rule text to see the formatted result.
            </p>
          )}
        </section>
      ) : (
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
                  <Input {...field} />
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
                <FormLabel>
                  Rule text
                  <ConditionValidationIcon text={field.value} />
                </FormLabel>
                <FormControl>
                  <Textarea rows={12} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="keywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Add words or phrases people might search for, separated by
                  commas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Related official rules</FormLabel>
            <div className="hidden grid-cols-[10rem_minmax(0,1fr)_2.25rem] gap-2 text-xs font-medium text-muted-foreground sm:grid">
              <span>Relationship</span>
              <span>Rule</span>
              <span />
            </div>
            <div className="flex flex-col gap-2">
              {links.map((link) => (
                <div
                  key={link.id}
                  className="grid grid-cols-[minmax(0,1fr)_2.25rem] gap-2 sm:grid-cols-[10rem_minmax(0,1fr)_2.25rem]"
                >
                  <Select
                    value={link.relation}
                    onValueChange={(value) => updateRelation(link.id, value)}
                  >
                    <SelectTrigger
                      className="col-span-2 w-full sm:col-span-1"
                      aria-label="Relationship to official rule"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="augments">Augments</SelectItem>
                      <SelectItem value="replaces">Replaces</SelectItem>
                    </SelectContent>
                  </Select>
                  <Combobox
                    groups={ruleGroups}
                    value={link.ruleSlug || undefined}
                    onSelect={(selectedRule) =>
                      updateRuleSlug(link.id, selectedRule.id)
                    }
                    placeholder="Search..."
                    searchPlaceholder="Search rules..."
                    emptyMessage="No rules found."
                    ariaLabel="Official rule"
                    className="w-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove related rule"
                    onClick={() => removeLink(link.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setLinks((current) => [...current, newRuleLinkRow()])
              }
            >
              <Plus />
              Add rule
            </Button>
            <FormDescription>
              Show whether this rule adds to or takes the place of an official
              rule.
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
      )}
    </Form>
  );
}
