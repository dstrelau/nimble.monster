"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { addMonsterToEncounter } from "@/app/actions/encounter";
import { EncounterCountControl } from "@/app/encounters/EncounterCountControl";
import { ownEncountersQueryOptions } from "@/app/encounters/ownEncountersQueryOptions";
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

interface AddToEncounterForm {
  encounterId: string;
  quantity: number;
  isPerHero: boolean;
  heroesPerMonster: number;
}

export const AddToEncounterDialog = ({
  monsterId,
  legendary = false,
}: {
  monsterId: string;
  legendary?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const availableEncounters = useQuery(ownEncountersQueryOptions());

  const form = useForm<AddToEncounterForm>({
    defaultValues: {
      encounterId: "",
      quantity: 1,
      isPerHero: false,
      heroesPerMonster: 1,
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
      formData.append("quantity", String(legendary ? 1 : data.quantity));
      formData.append("isPerHero", String(!legendary && data.isPerHero));
      formData.append("heroesPerMonster", String(data.heroesPerMonster));
      return addMonsterToEncounter(formData);
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      return queryClient.invalidateQueries({
        queryKey: ownEncountersQueryOptions().queryKey,
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

            {!legendary && (
              <EncounterCountControl
                quantity={form.watch("quantity")}
                isPerHero={form.watch("isPerHero")}
                heroesPerMonster={form.watch("heroesPerMonster")}
                onQuantityChange={(value) => form.setValue("quantity", value)}
                onIsPerHeroChange={(value) => form.setValue("isPerHero", value)}
                onHeroesPerMonsterChange={(value) =>
                  form.setValue("heroesPerMonster", value)
                }
              />
            )}

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
