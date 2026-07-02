"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  addMonsterToEncounter,
  listOwnEncounters,
} from "@/app/actions/encounter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

interface AddToEncounterForm {
  encounterId: string;
  quantity: number;
  isPerHero: boolean;
}

export const AddToEncounterDialog = ({ monsterId }: { monsterId: string }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const availableEncounters = useQuery({
    queryKey: ["listOwnEncounters"],
    queryFn: listOwnEncounters,
  });

  const form = useForm<AddToEncounterForm>({
    defaultValues: {
      encounterId: "",
      quantity: 1,
      isPerHero: false,
    },
  });

  const selectedEncounterId = form.watch("encounterId");
  const selectedEncounter = availableEncounters.data?.encounters?.find(
    (e) => e.id === selectedEncounterId
  );

  const isAlreadyInEncounter = Boolean(
    selectedEncounter?.monsters.some((entry) => entry.monster.id === monsterId)
  );

  const mutation = useMutation({
    mutationFn: async (data: AddToEncounterForm) => {
      const formData = new FormData();
      formData.append("encounterId", data.encounterId);
      formData.append("monsterId", monsterId);
      formData.append("quantity", String(data.quantity));
      formData.append("isPerHero", String(data.isPerHero));
      return addMonsterToEncounter(formData);
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      return queryClient.invalidateQueries({
        queryKey: ["listOwnEncounters"],
      });
    },
  });

  const onSubmit = (data: AddToEncounterForm) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CopyPlus />
          Add to Encounter
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Encounter</DialogTitle>
          <DialogDescription className="sr-only">
            Select an encounter to add this monster to.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="encounterId"
              rules={{ required: "Please select an encounter" }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an encounter" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableEncounters.data?.encounters?.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-1">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() =>
                        field.onChange(Math.max(1, field.value - 1))
                      }
                      disabled={field.value <= 1}
                    >
                      <Minus />
                    </Button>
                    <span className="w-5 text-center font-slab font-black">
                      {field.value}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => field.onChange(field.value + 1)}
                    >
                      <Plus />
                    </Button>
                  </>
                )}
              />

              <FormField
                control={form.control}
                name="isPerHero"
                render={({ field }) => (
                  <Toggle
                    size="sm"
                    pressed={field.value}
                    onPressedChange={field.onChange}
                    className="font-sans text-xs not-italic"
                  >
                    /hero
                  </Toggle>
                )}
              />
            </div>

            {selectedEncounterId && isAlreadyInEncounter && (
              <div className="text-warning text-sm">
                This monster is already in the selected encounter. Submitting
                will update its quantity.
              </div>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending
                  ? "Saving..."
                  : isAlreadyInEncounter
                    ? "Update Quantity"
                    : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
