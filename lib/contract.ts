// A tiny typed-RPC layer over internal `/_actions/*` route handlers.
//
// Server Actions give great DX (no manual serialization, types checked across
// the network boundary) but their transport is a per-build hashed action id, so
// a browser tab running an older bundle can't reach them after a deploy — the
// save silently fails. These route handlers live at stable URLs instead, so an
// old tab still hits a live endpoint after a deploy.
//
// A contract is the single source of truth shared by both sides: the client
// calls `call(contract, input)` and gets back a typed result; the route handler
// imports the same input type. Change the contract and both sides fail to
// compile.

export interface RouteContract<Input, Output> {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: (input: Input) => string;
  // Phantom: never set at runtime, exists so `call()` can recover the response
  // type from a contract value.
  readonly __output?: Output;
}

// Defines a contract. The Output type is declared by the caller and is not
// inferred from `contract`; annotate the route handler's response to keep the
// two in sync (see app/%5Factions/*/route.ts).
export function defineRoute<Input, Output>(
  contract: RouteContract<Input, Output>
): RouteContract<Input, Output> {
  return contract;
}

// Client-side caller. Same-origin only (these endpoints are cookie-authenticated
// and must not be reachable cross-origin — see proxy.ts).
export async function call<Input, Output>(
  contract: RouteContract<Input, Output>,
  input: Input
): Promise<Output> {
  const response = await fetch(contract.path(input), {
    method: contract.method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Action failed: ${response.status}`);
  }

  return response.json();
}
