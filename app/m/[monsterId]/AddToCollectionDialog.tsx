"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  addMonsterToCollection,
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

export const AddToCollectionDialog = ({ monsterId }: { monsterId: string }) => {
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
  const isMonsterAlreadyInCollection =
    selectedCollection?.monsters.find((m) => m.id === monsterId) !== undefined;

  const mutation = useMutation({
    mutationFn: async (data: AddToCollectionForm) => {
      const formData = new FormData();
      formData.append("collectionId", data.collectionId);
      formData.append("monsterId", monsterId);
      return addMonsterToCollection(formData);
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
            {selectedCollectionId && isMonsterAlreadyInCollection && (
              <div className="text-warning text-sm">
                This monster is already in the selected collection
              </div>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={mutation.isPending || isMonsterAlreadyInCollection}
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
