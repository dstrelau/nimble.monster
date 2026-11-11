"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
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
}

export function EditSourceDialog({ source }: EditSourceDialogProps) {
  const [open, setOpen] = useState(false);

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
          onSaved={() => setOpen(false)}
          submitLabel="Update Source"
        />
      </DialogContent>
    </Dialog>
  );
}
