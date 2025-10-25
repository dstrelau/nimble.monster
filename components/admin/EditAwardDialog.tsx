"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { AwardForm } from "@/components/admin/AwardForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Award } from "@/lib/types";

interface EditAwardDialogProps {
  award: Award;
  onSubmit: (formData: FormData) => void;
}

export function EditAwardDialog({ award, onSubmit }: EditAwardDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Award</DialogTitle>
        </DialogHeader>
        <AwardForm
          award={award}
          onSubmit={onSubmit}
          submitLabel="Update Award"
        />
      </DialogContent>
    </Dialog>
  );
}
