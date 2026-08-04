export interface RouteContract<Input, Output> {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  path: (input: Input) => string;
  readonly __output?: Output;
}

export function defineRoute<Input, Output>(
  contract: RouteContract<Input, Output>
): RouteContract<Input, Output> {
  return contract;
}

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
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : `Action failed: ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}
