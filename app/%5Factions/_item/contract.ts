import { defineRoute } from "@/lib/contract";
import type { CreateItemInput, UpdateItemInput } from "@/lib/services/items";

export interface ItemMutationResult {
  id: string;
  name: string;
}

export interface UpdateItemRequest {
  id: string;
  input: UpdateItemInput;
}

export const createItem = defineRoute<CreateItemInput, ItemMutationResult>({
  method: "POST",
  path: () => "/_actions/createItem",
});

export const updateItem = defineRoute<UpdateItemRequest, ItemMutationResult>({
  method: "POST",
  path: () => "/_actions/updateItem",
});
