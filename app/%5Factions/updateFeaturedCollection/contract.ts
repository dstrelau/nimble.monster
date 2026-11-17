import { defineRoute } from "@/lib/contract";

interface UpdateFeaturedCollectionInput {
  collectionId: string;
  featured: boolean;
}

export const updateFeaturedCollection = defineRoute<
  UpdateFeaturedCollectionInput,
  { success: true }
>({ method: "POST", path: () => "/_actions/updateFeaturedCollection" });
