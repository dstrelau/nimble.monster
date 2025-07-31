"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createCollection } from "@/app/actions/collection";
import { ValidCollectionVisibilities } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  visibility: z.enum(ValidCollectionVisibilities).default("private"),
  description: z.string().optional(),
});

type CollectionFormData = z.infer<typeof collectionSchema>;

export default function NewCollectionForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      name: "",
      visibility: "private" as "public" | "private" | "secret",
      description: "",
    },
  });

  return (
    <Card className="mb-6">
      <Collapsible>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Create Collection</CardTitle>
              <ChevronDown className="h-4 w-4" />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) => {
                  startTransition(async () => {
                    const result = await createCollection(data);
                    if (result.success && result.collection) {
                      form.reset();
                      router.push(`/my/collections/${result.collection.id}/edit`);
                    }
                  });
                })}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Collection Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isPending}>
                  {isPending ? "Creating..." : "Create"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
