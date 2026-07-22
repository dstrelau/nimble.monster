// Shared source of truth for whether a newer deployment is live than the one
// this browser tab loaded. Both StaleDeploymentBanner (which polls) and the
// global mutation error handler (which checks on failure) read from here, so
// the two never disagree about staleness.

let loadedBuildId: string | null = null;
let stale = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeStale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getStaleSnapshot(): boolean {
  return stale;
}

// Fetches the current server build id and compares it to the one captured when
// this tab first loaded. The first time they differ, marks the deployment stale
// and notifies subscribers. Network errors are ignored — we keep the last known
// state. Returns the current staleness.
export async function checkDeploymentStale(): Promise<boolean> {
  try {
    const res = await fetch("/api/build-id");
    if (!res.ok) {
      return stale;
    }
    const { buildId } = await res.json();
    if (typeof buildId !== "string") {
      return stale;
    }
    if (loadedBuildId === null) {
      loadedBuildId = buildId;
    } else if (buildId !== loadedBuildId && !stale) {
      stale = true;
      emit();
    }
  } catch {
    // Network error, keep the last known state.
  }
  return stale;
}
