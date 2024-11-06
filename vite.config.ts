import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import ViteYaml from "@modyfi/vite-plugin-yaml";

export default defineConfig({
  plugins: [sveltekit(), ViteYaml()],
});
