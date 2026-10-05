import { useQuery } from "@tanstack/react-query";
import { entityReferences } from "@/app/%5Factions/entityReferences/contract";
import { call } from "@/lib/contract";
import {
  ENTITY_REFERENCE_BATCH_SIZE,
  type EntityReference,
  type EntityReferenceRequest,
  type EntityType,
  normalizeEntityReferenceId,
} from "@/lib/types/entity-links";

interface PendingReference {
  request: EntityReferenceRequest;
  resolve: (reference: EntityReference | null) => void;
  reject: (error: unknown) => void;
}

let pending: PendingReference[] = [];

// One queue for all FormattedText instances, including separately mounted roots.
// React Query deduplicates each canonical key; the queue batches distinct keys.
async function flushReferences() {
  const requests = pending;
  pending = [];
  const batches: PendingReference[][] = [];
  for (
    let start = 0;
    start < requests.length;
    start += ENTITY_REFERENCE_BATCH_SIZE
  ) {
    batches.push(requests.slice(start, start + ENTITY_REFERENCE_BATCH_SIZE));
  }
  await Promise.all(
    batches.map(async (batch) => {
      try {
        const response = await call(
          entityReferences,
          batch.map(({ request }) => request)
        );
        const references = new Map(
          response.references.map((reference) => [
            `${reference.type}:${reference.id}`,
            reference,
          ])
        );
        for (const { request, resolve } of batch) {
          resolve(references.get(`${request.type}:${request.id}`) ?? null);
        }
      } catch (error) {
        for (const { reject } of batch) reject(error);
      }
    })
  );
}

function loadReference(
  type: EntityType,
  id: string
): Promise<EntityReference | null> {
  // Malformed shorthand must not poison a batch of otherwise valid references.
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    pending.push({ request: { type, id }, resolve, reject });
    if (pending.length === 1) {
      setTimeout(() => {
        void flushReferences();
      }, 0);
    }
  });
}

export function useEntityQuery(type: EntityType, id: string) {
  const canonicalId = normalizeEntityReferenceId(id);
  return useQuery<EntityReference | null>({
    queryKey: ["entity", type, canonicalId],
    queryFn: () => loadReference(type, canonicalId),
    staleTime: 60000,
  });
}
