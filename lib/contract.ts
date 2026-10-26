export interface RouteContract<Input, Output> {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: (input: Input) => string;
  readonly __output?: Output;
}

export function defineRoute<Input, Output>(
  contract: RouteContract<Input, Output>
): RouteContract<Input, Output> {
  return contract;
}

export class RouteError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string
  ) {
    super(message);
    this.name = "RouteError";
  }
}

export function call<Input, Output>(
  contract: RouteContract<Input, Output>,
  input: Input,
  options?: { signal?: AbortSignal }
): Promise<Output>;
export async function call<Input, Output>(
  contract: RouteContract<Input, Output>,
  input: Input,
  options: { signal?: AbortSignal } = {}
): Promise<Output | undefined> {
  const response = await fetch(contract.path(input), {
    method: contract.method,
    credentials: "same-origin",
    ...options,
    ...(contract.method === "GET"
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }),
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
    const code =
      typeof body === "object" &&
      body !== null &&
      "code" in body &&
      typeof body.code === "string"
        ? body.code
        : `HTTP_${response.status}`;
    throw new RouteError(message, response.status, code);
  }

  if (response.status === 204) return undefined;
  return response.json();
}
