import type { Config } from "tailwindcss";

/**
 * Searchable design language: SaaS dark mode, data-first, action-oriented.
 * See docs/DESIGN-LANGUAGE.md.
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      colors: {
        searchable: {
          bg: "var(--bg)",
          fg: "var(--fg)",
          muted: "var(--muted)",
          surface: "var(--surface)",
          accent: "var(--accent)",
          "accent-soft": "var(--accent-soft)",
          success: "var(--success)",
          "success-soft": "var(--success-soft)",
          danger: "var(--danger)",
          "danger-soft": "var(--danger-soft)",
          score: "var(--color-score)",
        },
      },
      backgroundImage: {
        "gradient-searchable": "linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end))",
      },
    },
  },
  plugins: [],
};

export default config;
