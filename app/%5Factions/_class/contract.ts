import { defineRoute } from "@/lib/contract";
import type { CreateClassInput } from "@/lib/db/class";

export type ClassSaveInput = Omit<CreateClassInput, "discordId">;

export interface ClassMutationResult {
  id: string;
  name: string;
}

export interface UpdateClassRequest {
  id: string;
  input: ClassSaveInput;
}

export const createClass = defineRoute<ClassSaveInput, ClassMutationResult>({
  method: "POST",
  path: () => "/_actions/createClass",
});

export const updateClass = defineRoute<UpdateClassRequest, ClassMutationResult>(
  {
    method: "POST",
    path: () => "/_actions/updateClass",
  }
);
