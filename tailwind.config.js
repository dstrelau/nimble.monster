/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  content: ["./web/**/*.html", "./web/**/*.templ"],
  theme: {
    fontFamily: {
      serif: ["beaufort-pro", "ui-serif"],
    },
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")],
};
