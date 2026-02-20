import type { Config } from "tailwindcss";

/**
 * Searchable design language: humanist sans, minimal + expressive colour,
 * rounded UI, strong typographic hierarchy, white-dominant.
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
      borderRadius: {
        searchable: "0.75rem",
        "searchable-lg": "1rem",
      },
      colors: {
        searchable: {
          bg: "var(--bg)",
          fg: "var(--fg)",
          muted: "var(--muted)",
          "muted-soft": "var(--muted-soft)",
          border: "var(--border)",
          "border-strong": "var(--border-strong)",
          surface: "var(--surface)",
          "surface-elevated": "var(--surface-elevated)",
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
        "gradient-searchable":
          "linear-gradient(135deg, var(--gradient-start), var(--gradient-mid), var(--gradient-end))",
      },
    },
  },
  plugins: [],
};

export default config;
