import type { Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";

interface SessionUser {
  id?: string;
  discordId?: string;
  username?: string;
  displayName?: string;
  image?: string;
}

interface MockSession {
  user: SessionUser;
  expires: string;
}

const mockPrisma = {
  user: {
    upsert: vi.fn(),
    findUnique: vi.fn(),
  },
};

vi.mock("./db", () => ({
  prisma: mockPrisma,
}));

const mockProfile = {
  id: "489841136114991106",
  username: "_byteslicer",
  avatar: "080cb5a1bc49c5626547a14a5d525c34",
  discriminator: "0",
  public_flags: 0,
  flags: 0,
  banner: null,
  accent_color: null,
  global_name: "ByteSlicer",
  avatar_decoration_data: null,
  collectibles: null,
  display_name_styles: null,
  banner_color: null,
  clan: null,
  primary_guild: null,
  mfa_enabled: true,
  locale: "en-US",
  premium_type: 0,
  email: "dean@strelau.net",
  verified: true,
  image_url:
    "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
};

const mockUser = {
  id: "user123",
  discordId: "489841136114991106",
  username: "_byteslicer",
  displayName: "ByteSlicer",
  avatar: "080cb5a1bc49c5626547a14a5d525c34",
  imageUrl:
    "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
};

const signInCallback = async ({ profile }: { profile?: Profile }) => {
  if (profile?.id) {
    await mockPrisma.user.upsert({
      where: { discordId: profile.id },
      update: {
        username: (profile.username as string) || "",
        displayName: (profile.global_name as string) || "",
        avatar: (profile.avatar as string) || null,
        imageUrl: (profile.image_url as string) || null,
      },
      create: {
        discordId: profile.id,
        username: (profile.username as string) || "",
        displayName: (profile.global_name as string) || "",
        avatar: (profile.avatar as string) || null,
      },
    });
  }
  return true;
};

const jwtCallback = async ({
  token,
  profile,
}: {
  token: JWT;
  profile?: Profile;
}) => {
  if (profile?.id) {
    token.discordId = profile.id;

    try {
      const user = await mockPrisma.user.findUnique({
        where: { discordId: profile.id },
      });
      if (user) {
        token.userId = user.id;
        token.username = user.username;
        token.displayName = user.displayName || user.username;
        token.avatar = user.avatar || undefined;
        token.imageUrl = user.imageUrl || undefined;
      }
    } catch {}
  }
  return token;
};

const sessionCallback = ({
  session,
  token,
}: {
  session: MockSession;
  token: JWT;
}) => {
  session.user.id = token.userId || "";
  session.user.discordId = token.discordId || "";
  if (token.username) {
    session.user.username = token.username;
  }
  if (token.displayName) {
    session.user.displayName = token.displayName;
  }
  session.user.image =
    token.imageUrl || token.avatar
      ? `https://cdn.discordapp.com/avatars/${token.discordId}/${token.avatar}.png`
      : "https://cdn.discordapp.com/embed/avatars/0.png";
  return session;
};

describe("NextAuth configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signIn callback", () => {
    it("creates new user when profile.id exists", async () => {
      const upsertMock = mockPrisma.user.upsert;
      upsertMock.mockResolvedValue(mockUser);

      const result = await signInCallback({
        profile: mockProfile,
      });

      expect(result).toBe(true);
      expect(upsertMock).toHaveBeenCalledWith({
        where: { discordId: "489841136114991106" },
        update: {
          username: "_byteslicer",
          displayName: "ByteSlicer",
          avatar: "080cb5a1bc49c5626547a14a5d525c34",
          imageUrl:
            "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
        },
        create: {
          discordId: "489841136114991106",
          username: "_byteslicer",
          displayName: "ByteSlicer",
          avatar: "080cb5a1bc49c5626547a14a5d525c34",
        },
      });
    });

    it("handles missing profile data gracefully", async () => {
      const upsertMock = mockPrisma.user.upsert;
      upsertMock.mockResolvedValue(mockUser);

      const profileWithMissingData = {
        id: "489841136114991106",
        username: null,
        global_name: null,
        avatar: null,
        image_url: null,
      };

      const result = await signInCallback({
        profile: profileWithMissingData,
      });

      expect(result).toBe(true);
      expect(upsertMock).toHaveBeenCalledWith({
        where: { discordId: "489841136114991106" },
        update: {
          username: "",
          displayName: "",
          avatar: null,
          imageUrl: null,
        },
        create: {
          discordId: "489841136114991106",
          username: "",
          displayName: "",
          avatar: null,
        },
      });
    });

    it("returns true when profile.id is missing", async () => {
      const upsertMock = mockPrisma.user.upsert;

      const result = await signInCallback({
        profile: { id: undefined },
      });

      expect(result).toBe(true);
      expect(upsertMock).not.toHaveBeenCalled();
    });
  });

  describe("jwt callback", () => {
    it("populates token with user data when profile exists", async () => {
      const findUniqueMock = mockPrisma.user.findUnique;
      findUniqueMock.mockResolvedValue(mockUser);

      const token: JWT = { displayName: "" };
      const result = await jwtCallback({
        token,
        profile: mockProfile,
      });

      expect(findUniqueMock).toHaveBeenCalledWith({
        where: { discordId: "489841136114991106" },
      });

      expect(result).toEqual({
        discordId: "489841136114991106",
        userId: "user123",
        username: "_byteslicer",
        displayName: "ByteSlicer",
        avatar: "080cb5a1bc49c5626547a14a5d525c34",
        imageUrl:
          "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
      });
    });

    it("falls back to username when displayName is missing", async () => {
      const userWithoutDisplayName = {
        ...mockUser,
        displayName: "",
      };

      const findUniqueMock = mockPrisma.user.findUnique;
      findUniqueMock.mockResolvedValue(userWithoutDisplayName);

      const token: JWT = { displayName: "" };
      const result = await jwtCallback({
        token,
        profile: mockProfile,
      });

      expect(result.displayName).toBe("_byteslicer");
    });

    it("handles database errors gracefully", async () => {
      const findUniqueMock = mockPrisma.user.findUnique;
      findUniqueMock.mockRejectedValue(new Error("Database error"));

      const token: JWT = { displayName: "" };
      const result = await jwtCallback({
        token,
        profile: mockProfile,
      });

      expect(result).toEqual({
        discordId: "489841136114991106",
        displayName: "",
      });
    });

    it("returns token unchanged when profile.id is missing", async () => {
      const findUniqueMock = mockPrisma.user.findUnique;

      const token: JWT = { existing: "data", displayName: "" };
      const result = await jwtCallback({
        token,
        profile: { id: undefined },
      });

      expect(findUniqueMock).not.toHaveBeenCalled();
      expect(result).toEqual({ existing: "data", displayName: "" });
    });

    it("handles user not found in database", async () => {
      const findUniqueMock = mockPrisma.user.findUnique;
      findUniqueMock.mockResolvedValue(null);

      const token: JWT = { displayName: "" };
      const result = await jwtCallback({
        token,
        profile: mockProfile,
      });

      expect(result).toEqual({
        discordId: "489841136114991106",
        displayName: "",
      });
    });
  });

  describe("session callback", () => {
    it("maps token data to session user", () => {
      const token: JWT = {
        userId: "user123",
        discordId: "489841136114991106",
        username: "_byteslicer",
        displayName: "ByteSlicer",
        avatar: "080cb5a1bc49c5626547a14a5d525c34",
        imageUrl:
          "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
      };

      const session = {
        user: {},
        expires: "2024-01-01",
      };

      const result = sessionCallback({
        session,
        token,
      });

      expect(result.user).toEqual({
        id: "user123",
        discordId: "489841136114991106",
        username: "_byteslicer",
        displayName: "ByteSlicer",
        image:
          "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png",
      });
    });

    it("generates Discord CDN URL when imageUrl is missing", () => {
      const token: JWT = {
        userId: "user123",
        discordId: "489841136114991106",
        username: "_byteslicer",
        displayName: "ByteSlicer",
        avatar: "080cb5a1bc49c5626547a14a5d525c34",
      };

      const session = {
        user: {},
        expires: "2024-01-01",
      };

      const result = sessionCallback({
        session,
        token,
      });

      expect(result.user.image).toBe(
        "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png"
      );
    });

    it("uses Discord CDN URL when imageUrl or avatar is present", () => {
      const customImageUrl = "https://example.com/custom-avatar.png";
      const token: JWT = {
        userId: "user123",
        discordId: "489841136114991106",
        username: "_byteslicer",
        displayName: "ByteSlicer",
        avatar: "080cb5a1bc49c5626547a14a5d525c34",
        imageUrl: customImageUrl,
      };

      const session = {
        user: {},
        expires: "2024-01-01",
      };

      const result = sessionCallback({
        session,
        token,
      });

      expect(result.user.image).toBe(
        "https://cdn.discordapp.com/avatars/489841136114991106/080cb5a1bc49c5626547a14a5d525c34.png"
      );
    });

    it("handles missing token values gracefully", () => {
      const token: JWT = { displayName: "" };
      const session = {
        user: {},
        expires: "2024-01-01",
      };

      const result = sessionCallback({
        session,
        token,
      });

      expect(result.user).toEqual({
        id: "",
        discordId: "",
        image: "https://cdn.discordapp.com/embed/avatars/0.png",
      });
    });

    it("uses default avatar when avatar and imageUrl are missing", () => {
      const token: JWT = {
        userId: "user123",
        discordId: "489841136114991106",
        username: "_byteslicer",
        displayName: "ByteSlicer",
      };

      const session = {
        user: {},
        expires: "2024-01-01",
      };

      const result = sessionCallback({
        session,
        token,
      });

      expect(result.user.image).toBe(
        "https://cdn.discordapp.com/embed/avatars/0.png"
      );
    });
  });
});
