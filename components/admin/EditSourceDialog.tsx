"use client";

import { Pencil } from "lucide-react";
import { useState, useTransition } from "react";
import { SourceForm } from "@/components/admin/SourceForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SourceRow } from "@/lib/db/schema";

interface EditSourceDialogProps {
  source: SourceRow;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function EditSourceDialog({ source, onSubmit }: EditSourceDialogProps) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      await onSubmit(formData);
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
        </DialogHeader>
        <SourceForm
          source={source}
          onSubmit={handleSubmit}
          submitLabel="Update Source"
        />
      </DialogContent>
    </Dialog>
  );
}
