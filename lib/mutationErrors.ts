// Minimal store for a transient, user-facing error message surfaced by the
// global mutation error handler (see lib/queryClient.ts). Kept outside React so
// the QueryClient — which is created outside the component tree — can push into
// it; MutationErrorToast renders it.

let message: string | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeMutationError(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMutationErrorSnapshot(): string | null {
  return message;
}

export function reportMutationError(next: string): void {
  message = next;
  emit();
}

export function dismissMutationError(): void {
  if (message !== null) {
    message = null;
    emit();
  }
}
