/** @type {import('tailwindcss').Config} */
export const content = [
  "./app/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/**/*.{js,ts,jsx,tsx,mdx}",
];
export const theme = {
  extend: {
    fontFamily: {
      sans: ["Roboto", "sans-serif"],
      condensed: ["Roboto Condensed", "sans-serif"],
      slab: ["Roboto Slab", "sans-serif"],
    },
  },
};
export const plugins = [
  require("@tailwindcss/forms"),
  require("@tailwindcss/typography"),
  require("daisyui"),
];
export const daisyui = {
  prefix: "d-",
};
