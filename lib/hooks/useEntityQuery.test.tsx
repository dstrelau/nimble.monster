import { QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FormattedText } from "@/components/shared/FormattedText";
import { getQueryClient } from "@/lib/queryClient";
import type { EntityReferenceRequest } from "@/lib/types/entity-links";
import { uuidToIdentifier } from "@/lib/utils/slug";
import { useEntityQuery } from "./useEntityQuery";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const missingId = "33333333-3333-4333-8333-333333333333";
const fetchMock = vi.fn<typeof fetch>();

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

function Probe({ type, id }: EntityReferenceRequest) {
  const query = useEntityQuery(type, id);
  return (
    <span data-testid={id}>
      {query.isError
        ? "error"
        : query.isLoading
          ? "loading"
          : (query.data?.name ?? "missing")}
    </span>
  );
}

function requests() {
  return fetchMock.mock.calls.map(([input]) =>
    new URL(String(input), "http://localhost").searchParams
      .getAll("reference")
      .sort()
  );
}

beforeEach(() => {
  getQueryClient().clear();
  getQueryClient().setDefaultOptions({ queries: { retry: false } });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input) => {
    const values = new URL(
      String(input),
      "http://localhost"
    ).searchParams.getAll("reference");
    const names = new Map([
      [`item:${firstId}`, "First item"],
      [`item:${secondId}`, "Second item"],
      [`table:${firstId}`, "First table"],
    ]);
    return new Response(
      JSON.stringify({
        references: values.flatMap((value) => {
          const name = names.get(value);
          if (!name) return [];
          const [type, id] = value.split(":");
          return [{ type, id, name }];
        }),
      })
    );
  });
});

afterEach(() => {
  cleanup();
  getQueryClient().clear();
  vi.unstubAllGlobals();
});

describe("shared entity reference loading", () => {
  it("batches across FormattedText blocks and shares UUID/base32 and noninteractive results", async () => {
    const { rerender } = render(
      <>
        <FormattedText
          content={`@item:[${firstId}] @table:${uuidToIdentifier(firstId)}`}
          conditions={[]}
        />
        <FormattedText
          content={`@item:${uuidToIdentifier(firstId)}`}
          conditions={[]}
          noInteractive
        />
      </>
    );
    expect(await screen.findAllByText("First item")).toHaveLength(2);
    expect(
      await screen.findByRole("link", { name: "First table" })
    ).toHaveAttribute("href", expect.stringContaining("/tables/"));
    expect(screen.getAllByRole("link", { name: "First item" })).toHaveLength(1);
    expect(requests()).toEqual([[`item:${firstId}`, `table:${firstId}`]]);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/_actions\/entityReferences\?/),
      { method: "GET", credentials: "same-origin" }
    );

    rerender(
      <FormattedText
        content={`@item:${uuidToIdentifier(firstId)} @item:${uuidToIdentifier(secondId)}`}
        conditions={[]}
      />
    );
    expect(await screen.findByText("Second item")).toBeInTheDocument();
    expect(requests()).toEqual([
      [`item:${firstId}`, `table:${firstId}`],
      [`item:${secondId}`],
    ]);
  });

  it("deduplicates an in-flight request when another observer mounts", async () => {
    let finish: (response: Response) => void = () => {
      throw new Error("Fetch not started");
    };
    fetchMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    const first = renderHook(() => useEntityQuery("item", firstId), {
      wrapper,
    });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const second = renderHook(
      () => useEntityQuery("item", uuidToIdentifier(firstId)),
      { wrapper }
    );
    await act(async () => {
      finish(
        new Response(
          JSON.stringify({
            references: [{ type: "item", id: firstId, name: "First item" }],
          })
        )
      );
    });
    await waitFor(() =>
      expect(first.result.current.data?.name).toBe("First item")
    );
    expect(second.result.current.data?.name).toBe("First item");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches null results and refetches after invalidation", async () => {
    const first = renderHook(() => useEntityQuery("item", missingId), {
      wrapper,
    });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    expect(first.result.current.data).toBeNull();
    renderHook(() => useEntityQuery("item", uuidToIdentifier(missingId)), {
      wrapper,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      await getQueryClient().invalidateQueries({
        queryKey: ["entity", "item", missingId],
      });
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(first.result.current.data).toBeNull();
  });

  it("splits large batches at 50 and isolates a failed batch from successful results", async () => {
    fetchMock.mockImplementation(async (input) => {
      const values = new URL(
        String(input),
        "http://localhost"
      ).searchParams.getAll("reference");
      if (values.length === 50) return new Response(null, { status: 503 });
      return new Response(
        JSON.stringify({
          references: [{ type: "item", id: secondId, name: "Second item" }],
        })
      );
    });
    const ids = Array.from(
      { length: 50 },
      (_, index) =>
        `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`
    );
    render(
      <div>
        {ids.map((id) => (
          <Probe key={id} type="item" id={id} />
        ))}
        <Probe type="item" id={secondId} />
      </div>,
      { wrapper }
    );
    expect(await screen.findByText("Second item")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("error")).toHaveLength(50));
    expect(requests().map((batch) => batch.length)).toEqual([50, 1]);
    expect(
      getQueryClient().getQueryData([
        "entity",
        "item",
        "00000000-0000-4000-8000-000000000000",
      ])
    ).toBeUndefined();
  });

  it("allows recovery from a network failure instead of caching it as null", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    const query = renderHook(() => useEntityQuery("item", firstId), {
      wrapper,
    });
    await waitFor(() => expect(query.result.current.isError).toBe(true));
    expect(query.result.current.data).toBeUndefined();
    await act(async () => {
      await query.result.current.refetch();
    });
    await waitFor(() =>
      expect(query.result.current.data?.name).toBe("First item")
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("keeps malformed shorthand out of otherwise valid batches", async () => {
    render(
      <>
        <Probe type="item" id="bad id" />
        <Probe type="item" id={firstId} />
      </>,
      { wrapper }
    );
    expect(await screen.findByText("First item")).toBeInTheDocument();
    expect(await screen.findByText("missing")).toBeInTheDocument();
    expect(requests()).toEqual([[`item:${firstId}`]]);
  });

  it("refreshes stale cached names when another reference mounts", async () => {
    getQueryClient().setQueryData(
      ["entity", "item", firstId],
      { type: "item", id: firstId, name: "Old name" },
      { updatedAt: Date.now() - 60001 }
    );
    const query = renderHook(
      () => useEntityQuery("item", uuidToIdentifier(firstId)),
      { wrapper }
    );
    await waitFor(() =>
      expect(query.result.current.data?.name).toBe("First item")
    );
    expect(requests()).toEqual([[`item:${firstId}`]]);
  });
});
