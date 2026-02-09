"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  addAncestryToCollection,
  addBackgroundToCollection,
  addCompanionToCollection,
  addItemToCollection,
  addMonsterToCollection,
  addSpellSchoolToCollection,
  addSubclassToCollection,
  listOwnCollections,
} from "@/app/actions/collection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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

interface AddToCollectionForm {
  collectionId: string;
}

type AddToCollectionDialogProps =
  | { type: "monster"; monsterId: string }
  | { type: "item"; itemId: string }
  | { type: "spellSchool"; spellSchoolId: string }
  | { type: "companion"; companionId: string }
  | { type: "ancestry"; ancestryId: string }
  | { type: "background"; backgroundId: string }
  | { type: "subclass"; subclassId: string };

export const AddToCollectionDialog = (props: AddToCollectionDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const availableCollections = useQuery({
    queryKey: ["listOwnCollections"],
    queryFn: listOwnCollections,
  });

  const form = useForm<AddToCollectionForm>({
    defaultValues: {
      collectionId: "",
    },
  });

  const selectedCollectionId = form.watch("collectionId");
  const selectedCollection = availableCollections.data?.collections?.find(
    (c) => c.id === selectedCollectionId
  );

  const isAlreadyInCollection = (() => {
    if (!selectedCollection) return false;
    switch (props.type) {
      case "monster":
        return selectedCollection.monsters.some(
          (m) => m.id === props.monsterId
        );
      case "item":
        return selectedCollection.items.some((i) => i.id === props.itemId);
      case "spellSchool":
        return selectedCollection.spellSchools.some(
          (s) => s.id === props.spellSchoolId
        );
      case "companion":
        return selectedCollection.companions.some(
          (c) => c.id === props.companionId
        );
      case "ancestry":
        return selectedCollection.ancestries.some(
          (a) => a.id === props.ancestryId
        );
      case "background":
        return selectedCollection.backgrounds.some(
          (b) => b.id === props.backgroundId
        );
      case "subclass":
        return selectedCollection.subclasses.some(
          (s) => s.id === props.subclassId
        );
    }
  })();

  const mutation = useMutation({
    mutationFn: async (data: AddToCollectionForm) => {
      const formData = new FormData();
      formData.append("collectionId", data.collectionId);

      switch (props.type) {
        case "monster":
          formData.append("monsterId", props.monsterId);
          return addMonsterToCollection(formData);
        case "item":
          formData.append("itemId", props.itemId);
          return addItemToCollection(formData);
        case "spellSchool":
          formData.append("spellSchoolId", props.spellSchoolId);
          return addSpellSchoolToCollection(formData);
        case "companion":
          formData.append("companionId", props.companionId);
          return addCompanionToCollection(formData);
        case "ancestry":
          formData.append("ancestryId", props.ancestryId);
          return addAncestryToCollection(formData);
        case "background":
          formData.append("backgroundId", props.backgroundId);
          return addBackgroundToCollection(formData);
        case "subclass":
          formData.append("subclassId", props.subclassId);
          return addSubclassToCollection(formData);
      }
    },
    onSuccess: () => {
      setOpen(false);
      form.reset();
      return queryClient.invalidateQueries({
        queryKey: ["listOwnCollections"],
      });
    },
  });

  const onSubmit = (data: AddToCollectionForm) => {
    mutation.mutate(data);
  };

  const entityType: Record<AddToCollectionDialogProps["type"], string> = {
    monster: "monster",
    item: "item",
    spellSchool: "spell school",
    companion: "companion",
    ancestry: "ancestry",
    background: "background",
    subclass: "subclass",
  };
  const entityLabel = entityType[props.type];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CopyPlus />
          Add to Collection
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="collectionId"
              rules={{ required: "Please select a collection" }}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a collection" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCollections.data?.collections?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedCollectionId && isAlreadyInCollection && (
              <div className="text-warning text-sm">
                This {entityLabel} is already in the selected collection
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending || isAlreadyInCollection}
              >
                {mutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
