import {
  defaultShouldDehydrateQuery,
  isServer,
  MutationCache,
  QueryClient,
} from "@tanstack/react-query";
import { checkDeploymentStale } from "@/lib/deployment";
import { reportMutationError } from "@/lib/mutationErrors";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

function makeQueryClient() {
  return new QueryClient({
    // Global fallback so a failed mutation is never a silent no-op. If the
    // failure is because a newer deployment is live (a Server Action from an
    // older bundle no longer resolves), the stale-deployment banner prompts a
    // refresh; otherwise we surface a transient error toast. A mutation that
    // renders its own error UI can opt out with meta.suppressErrorToast.
    mutationCache: new MutationCache({
      onError: (_error, _variables, _context, mutation) => {
        if (mutation.meta?.suppressErrorToast) {
          return;
        }
        void checkDeploymentStale().then((stale) => {
          if (!stale) {
            reportMutationError(GENERIC_ERROR_MESSAGE);
          }
        });
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
