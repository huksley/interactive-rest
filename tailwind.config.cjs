const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    /**
     * Base CSS styles which are applied EVERYWHERE.
     * @see https://tailwindcss.com/docs/preflight#images-are-block-level
     * @see https://github.com/tailwindlabs/tailwindcss/blob/master/src/css/preflight.css
     */
    preflight: true,
  },
};
