import { z } from "zod";
import * as repository from "../monsters/repository";
import type {
  CreateHazardInput,
  Hazard,
  UpdateHazardInput,
} from "../monsters/types";
import { PaginateMonstersSortOptions } from "../monsters/types";

export { toHazardMonsterView } from "./converters";

const PaginateHazardsSchema = z.object({
  search: z.string().optional(),
  sort: z.enum(PaginateMonstersSortOptions).default("-createdAt"),
  limit: z.number().min(1).max(100).default(10),
  cursor: z.string().optional(),
  creatorId: z.string().optional(),
  source: z.string().optional(),
  level: z.number().optional(),
});

export type PaginateHazardsParams = z.input<typeof PaginateHazardsSchema>;
export type PaginateHazardsResponse = {
  data: Hazard[];
  nextCursor: string | null;
};

export async function paginatePublicHazards(
  params: PaginateHazardsParams
): Promise<PaginateHazardsResponse> {
  return repository.paginateHazards({
    ...PaginateHazardsSchema.parse(params),
    includePrivate: false,
  });
}

export async function paginateMyHazards(
  creatorId: string,
  params: Omit<PaginateHazardsParams, "creatorId">
): Promise<PaginateHazardsResponse> {
  return repository.paginateHazards({
    ...PaginateHazardsSchema.omit({ creatorId: true }).parse(params),
    creatorId,
    includePrivate: true,
  });
}

export async function getPublicOrOwnedHazard(
  id: string,
  viewerDiscordId?: string
): Promise<Hazard | null> {
  const hazard = await repository.findHazard(id);
  if (!hazard) return null;
  if (
    hazard.visibility !== "public" &&
    hazard.creator.discordId !== viewerDiscordId
  ) {
    return null;
  }
  return hazard;
}

export async function getOwnedHazard(
  id: string,
  creatorId: string
): Promise<Hazard | null> {
  return repository.findHazardWithCreatorId(id, creatorId);
}

export async function createHazard(
  input: CreateHazardInput,
  creatorDiscordId: string
): Promise<Hazard> {
  return repository.createHazard(input, creatorDiscordId);
}

export async function updateHazard(
  input: UpdateHazardInput,
  creatorDiscordId: string
): Promise<Hazard> {
  return repository.updateHazard(input, creatorDiscordId);
}

export async function deleteHazard(
  id: string,
  creatorDiscordId: string
): Promise<boolean> {
  return repository.deleteHazard(id, creatorDiscordId);
}
