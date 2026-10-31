import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

// Run in the runtime image, not the builder: only shipped files are available.
const directory = await mkdtemp(join(tmpdir(), "nimble-smoke-"));
const server = spawn(process.execPath, ["server.js"], {
  env: {
    PATH: process.env.PATH,
    NODE_ENV: "production",
    HOSTNAME: "127.0.0.1",
    PORT: "3001",
    DATABASE_URL: `file:${join(directory, "smoke.db")}`,
    AUTH_SECRET: "disposable-build-smoke-test-only",
    OTEL_SDK_DISABLED: "true",
  },
  stdio: "inherit",
});
const closed = new Promise((resolve) => server.once("close", resolve));

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error("Standalone server exited");
    const response = await fetch("http://127.0.0.1:3001/api/build-id", {
      signal: AbortSignal.timeout(1000),
    }).catch(() => null);
    if (response) {
      if (!response.ok || typeof (await response.json()).buildId !== "string") {
        throw new Error(`Standalone build-id failed: HTTP ${response.status}`);
      }
      ready = true;
      break;
    }
    await delay(500);
  }
  if (!ready) throw new Error("Standalone server did not become ready");
  const response = await fetch("http://127.0.0.1:3001/", {
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok || !(await response.text()).includes("Browse Monsters")) {
    throw new Error(`Standalone homepage failed: HTTP ${response.status}`);
  }
  process.stdout.write("Standalone smoke test: build-id and homepage HTTP 200\n");
} finally {
  server.kill("SIGKILL");
  await closed;
  await rm(directory, { recursive: true, force: true });
}
