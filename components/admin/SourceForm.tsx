"use client";

import { BookOpen } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SourceFormProps {
  onSubmit: (formData: FormData) => void;
}

export function SourceForm({ onSubmit }: SourceFormProps) {
  const nameId = useId();
  const abbreviationId = useId();
  const licenseId = useId();
  const linkId = useId();

  return (
    <form action={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={nameId}>Name</Label>
        <Input id={nameId} name="name" required placeholder="Core Rulebook" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={abbreviationId}>Abbreviation</Label>
        <Input
          id={abbreviationId}
          name="abbreviation"
          required
          placeholder="CR"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={licenseId}>License</Label>
        <Input id={licenseId} name="license" required placeholder="CC BY 4.0" />
      </div>

      <div className="space-y-2">
        <Label htmlFor={linkId}>Link</Label>
        <Input
          id={linkId}
          name="link"
          type="url"
          required
          placeholder="https://example.com/rulebook"
        />
      </div>

      <Button type="submit" className="flex items-center gap-2">
        <BookOpen className="size-4" />
        Create Source
      </Button>
    </form>
  );
}
