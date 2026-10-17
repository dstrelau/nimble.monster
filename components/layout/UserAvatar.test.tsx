import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import type { User } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";

afterEach(cleanup);

const user: User = {
  id: "avatar-user",
  discordId: "avatar-discord-user",
  username: "avatar-user",
  displayName: "Avatar User",
  imageUrl: "https://cdn.discordapp.com/embed/avatars/1.png",
};

it("includes the avatar image in server HTML without flashing a fallback", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<UserAvatar user={user} size={24} />);
  const image = container.querySelector("img");
  expect(image).toHaveAttribute("src", user.imageUrl);
  expect(image).toHaveAttribute("width", "24");
  expect(image).toHaveAttribute("loading", "eager");
  expect(container.querySelector('[data-slot="avatar-fallback"]')).toBeNull();
});

it("shows initials for missing or failed images and loads a changed URL", () => {
  const { rerender } = render(<UserAvatar user={user} size="sm" />);
  fireEvent.error(screen.getByRole("img", { name: user.displayName }));
  expect(screen.getByText("A")).toBeInTheDocument();
  expect(screen.queryByRole("img")).toBeNull();

  rerender(<UserAvatar user={{ ...user, imageUrl: undefined }} size="sm" />);
  expect(screen.getByText("A")).toBeInTheDocument();

  const imageUrl = "https://cdn.discordapp.com/embed/avatars/2.png";
  rerender(<UserAvatar user={{ ...user, imageUrl }} size="sm" />);
  expect(screen.getByRole("img")).toHaveAttribute("src", imageUrl);
  expect(screen.queryByText("A")).toBeNull();
});

it("server-renders the guest avatar", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<UserAvatar size="sm" />);
  expect(container.querySelector("img")).toHaveAttribute(
    "src",
    "https://cdn.discordapp.com/embed/avatars/0.png"
  );
});
