"use client";

import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useId, useRef } from "react";
import {
  createSource,
  type SourceInput,
  updateSource,
} from "@/app/%5Factions/_source/contract";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { call } from "@/lib/contract";
import type { SourceRow } from "@/lib/db/schema";

interface SourceFormProps {
  source?: SourceRow;
  onSaved?: () => void;
  submitLabel?: string;
}

export function SourceForm({
  source,
  onSaved,
  submitLabel = "Create Source",
}: SourceFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (_previous: { error: string | null }, formData: FormData) => {
      const input: SourceInput = {
        name: String(formData.get("name") ?? ""),
        abbreviation: String(formData.get("abbreviation") ?? ""),
        license: String(formData.get("license") ?? ""),
        link: String(formData.get("link") ?? ""),
      };
      try {
        if (source) {
          await call(updateSource, { ...input, id: source.id });
        } else {
          await call(createSource, input);
          formRef.current?.reset();
        }
        router.refresh();
        onSaved?.();
        return { error: null };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : "Save failed",
        };
      }
    },
    { error: null }
  );
  const nameId = useId();
  const abbreviationId = useId();
  const licenseId = useId();
  const linkId = useId();

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="space-y-4"
    >
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input
          id={nameId}
          name="name"
          defaultValue={source?.name}
          required
          placeholder="Core Rulebook"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={abbreviationId}>Abbreviation</Label>
        <Input
          id={abbreviationId}
          name="abbreviation"
          defaultValue={source?.abbreviation}
          required
          placeholder="CR"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={licenseId}>License</Label>
        <Input
          id={licenseId}
          name="license"
          defaultValue={source?.license}
          required
          placeholder="CC BY 4.0"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={linkId}>Link</Label>
        <Input
          id={linkId}
          name="link"
          type="url"
          defaultValue={source?.link}
          required
          placeholder="https://example.com/rulebook"
        />
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2"
      >
        <BookOpen className="size-4" />
        {submitLabel}
      </Button>
    </form>
  );
}
