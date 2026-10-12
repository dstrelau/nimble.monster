import { defineRoute } from "@/lib/contract";
import type {
  CreateBackgroundInput,
  UpdateBackgroundInput,
} from "@/lib/services/backgrounds/types";

export interface BackgroundMutationResult {
  id: string;
  name: string;
}

export interface UpdateBackgroundRequest {
  id: string;
  input: UpdateBackgroundInput;
}

export const createBackground = defineRoute<
  CreateBackgroundInput,
  BackgroundMutationResult
>({ method: "POST", path: () => "/_actions/createBackground" });

export const updateBackground = defineRoute<
  UpdateBackgroundRequest,
  BackgroundMutationResult
>({ method: "POST", path: () => "/_actions/updateBackground" });
