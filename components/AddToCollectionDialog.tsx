"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  addItemToCollection,
  addMonsterToCollection,
  addSpellSchoolToCollection,
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
  | { type: "spellSchool"; spellSchoolId: string };

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

  const isAlreadyInCollection =
    props.type === "monster"
      ? selectedCollection?.monsters.find((m) => m.id === props.monsterId) !==
        undefined
      : props.type === "item"
        ? selectedCollection?.items.find((i) => i.id === props.itemId) !==
          undefined
        : selectedCollection?.spellSchools.find(
            (s) => s.id === props.spellSchoolId
          ) !== undefined;

  const mutation = useMutation({
    mutationFn: async (data: AddToCollectionForm) => {
      const formData = new FormData();
      formData.append("collectionId", data.collectionId);

      if (props.type === "monster") {
        formData.append("monsterId", props.monsterId);
        return addMonsterToCollection(formData);
      } else if (props.type === "item") {
        formData.append("itemId", props.itemId);
        return addItemToCollection(formData);
      } else {
        formData.append("spellSchoolId", props.spellSchoolId);
        return addSpellSchoolToCollection(formData);
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

  const entityType =
    props.type === "monster"
      ? "monster"
      : props.type === "item"
        ? "item"
        : "spell school";

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
                This {entityType} is already in the selected collection
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
