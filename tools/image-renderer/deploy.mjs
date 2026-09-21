import { readFile } from "node:fs/promises";
import { SpritesClient } from "@fly/sprites";

const token = process.env.SPRITES_TOKEN;
const spriteName = process.env.IMAGE_RENDERER_SPRITE;
const rendererSecret = process.env.IMAGE_RENDERER_SECRET;
const honeycombApiKey = process.env.HONEYCOMB_API_KEY;
const bundlePath = process.argv[2];

if (
  !token ||
  !spriteName ||
  !rendererSecret ||
  !honeycombApiKey ||
  !bundlePath
) {
  throw new Error(
    "SPRITES_TOKEN, IMAGE_RENDERER_SPRITE, IMAGE_RENDERER_SECRET, HONEYCOMB_API_KEY, and the renderer bundle path are required"
  );
}

const client = new SpritesClient(token);
await client.getSprite(spriteName);
const sprite = client.sprite(spriteName);
const rendererDirectory = "/home/sprite/nimble-image-renderer";

try {
  await sprite.execFile("test", ["-x", "/usr/bin/google-chrome"], {
    timeout: 10_000,
  });
} catch {
  await sprite.execFile(
    "sudo",
    ["apt-get", "update"],
    { timeout: 10 * 60_000 }
  );
  await sprite.execFile("wget", [
    "--quiet",
    "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb",
    "--output-document=/tmp/google-chrome-stable_current_amd64.deb",
  ]);
  await sprite.execFile(
    "sudo",
    [
      "apt-get",
      "install",
      "--yes",
      "/tmp/google-chrome-stable_current_amd64.deb",
      "fonts-ipafont-gothic",
      "fonts-wqy-zenhei",
      "fonts-thai-tlwg",
      "fonts-kacst",
      "fonts-freefont-ttf",
    ],
    { timeout: 10 * 60_000 }
  );
  await sprite.execFile(
    "rm",
    ["/tmp/google-chrome-stable_current_amd64.deb"],
    { timeout: 10_000 }
  );
}

await sprite.execFile("mkdir", ["-p", rendererDirectory], { timeout: 10_000 });
const filesystem = sprite.filesystem(rendererDirectory);
await filesystem.writeFile(
  "package.json",
  JSON.stringify({
    private: true,
    type: "module",
    dependencies: { "puppeteer-core": "24.15.0" },
  })
);
await sprite.execFile("npm", ["install", "--omit=dev", "--no-package-lock"], {
  cwd: rendererDirectory,
  timeout: 10 * 60_000,
});
await filesystem.writeFile("render.mjs.next", await readFile(bundlePath));
await sprite.execFile(
  "mv",
  [
    `${rendererDirectory}/render.mjs.next`,
    `${rendererDirectory}/render.mjs`,
  ],
  { timeout: 10_000 }
);

try {
  await sprite.getService("image-renderer");
  await sprite.deleteService("image-renderer");
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes("not found")) {
    throw error;
  }
}

const serviceEvents = await sprite.createService(
  "image-renderer",
  {
    cmd: "node",
    args: [`${rendererDirectory}/render.mjs`],
    dir: rendererDirectory,
    env: {
      HONEYCOMB_API_KEY: honeycombApiKey,
      IMAGE_RENDER_SOURCE_URL: "https://nimble.nexus",
      IMAGE_RENDERER_SECRET: rendererSecret,
      PUPPETEER_EXECUTABLE_PATH: "/usr/bin/google-chrome",
      NODE_ENV: "production",
    },
    httpPort: 8080,
  },
  "10s"
);
for await (const event of serviceEvents) {
  if (event.type === "error" || event.type === "exit") {
    throw new Error(
      `Image renderer service failed to start${event.exitCode === undefined ? "" : ` (exit ${event.exitCode})`}`
    );
  }
}
await sprite.updateURLSettings({ auth: "public" });
