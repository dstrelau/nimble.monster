import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomRuleForm } from "@/app/custom-rules/CustomRuleForm";
import { getCustomRuleUrl } from "@/lib/utils/url";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@/components/condition/ConditionValidationIcon", () => ({
  ConditionValidationIcon: () => null,
}));
vi.mock("@/app/custom-rules/CustomRuleBody", () => ({
  CustomRuleBody: () => null,
}));
const rule = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Old name",
  content: "Move 3 spaces",
  keywords: "movement",
  visibility: "private",
  links: [{ ruleSlug: "movement", relation: "replaces" }],
} satisfies React.ComponentProps<typeof CustomRuleForm>["rule"];
function renderForm(creating: boolean) {
  render(
    <CustomRuleForm
      rule={rule}
      ruleGroups={[]}
      creatorDiscordId="owner"
      isCreating={creating}
    />
  );
  fireEvent.change(screen.getByRole("textbox", { name: "Name" }), {
    target: { value: "New name" },
  });
}
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});
describe.each([true, false])("custom rule creating=%s", (creating) => {
  it("uses stable JSON transport, pending controls and fresh canonical navigation", async () => {
    let finish: (response: Response) => void = () => undefined;
    const fetchMock = vi.fn(
      (_url: string, _options: RequestInit) =>
        new Promise<Response>((resolve) => {
          finish = resolve;
        })
    );
    vi.stubGlobal("fetch", fetchMock);
    renderForm(creating);
    const label = creating ? "Create" : "Save";
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    expect(screen.getByRole("button", { name: label })).toBeDisabled();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(
      creating ? "/_actions/createCustomRule" : "/_actions/updateCustomRule"
    );
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("same-origin");
    const headers = new Headers(options.headers);
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.has("next-action")).toBe(false);
    const body = JSON.parse(String(options.body));
    expect(creating ? body : body.input).toEqual({
      ...rule,
      id: undefined,
      name: "New name",
    });
    if (!creating) expect(body.id).toBe(rule.id);
    const result = { id: rule.id, name: "New name" };
    finish(Response.json(result, { status: creating ? 201 : 200 }));
    await waitFor(() =>
      expect(mocks.push).toHaveBeenCalledWith(getCustomRuleUrl(result))
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it.each([
    "http",
    "network",
  ])("retains input after %s failures and allows manual retry", async (failure) => {
    const fetchMock = vi.fn();
    if (failure === "http")
      fetchMock.mockResolvedValue(
        Response.json({ error: "Not authenticated" }, { status: 401 })
      );
    else fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    vi.stubGlobal("fetch", fetchMock);
    renderForm(creating);
    const label = creating ? "Create" : "Save";
    fireEvent.click(screen.getByRole("button", { name: label }));
    const message =
      failure === "http" ? "Not authenticated" : "Failed to fetch";
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getAllByText(message)).toHaveLength(1);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(
      "New name"
    );
    expect(screen.getByRole("textbox", { name: "Rule text" })).toHaveValue(
      rule.content
    );
    expect(screen.getByRole("button", { name: label })).toBeEnabled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
    fetchMock.mockResolvedValue(
      Response.json({ id: rule.id, name: "New name" })
    );
    fireEvent.click(screen.getByRole("button", { name: label }));
    await waitFor(() => expect(mocks.push).toHaveBeenCalled());
  });
});
