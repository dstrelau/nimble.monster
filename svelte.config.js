import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
export default {
  kit: {
    preprocess: vitePreprocess(),
    paths: {
      base: process.argv.includes("dev") ? "" : process.env.BASE_PATH,
    },
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
  },
};
