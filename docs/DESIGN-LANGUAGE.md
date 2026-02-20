# Searchable Design Language

When building any component for this platform, follow these principles. The goal: **“We’re serious, but not intimidating.”**

---

## Core principles

1. **Minimalist & professional** — SaaS dark-mode aesthetic. Slate/zinc grays, lots of white space. No visual noise.
2. **Data-first** — Charts and numbers are the hero. Use bold typography for scores and key metrics.
3. **Action-oriented** — Every **insight** has a corresponding **action** (e.g. “Optimize this page”, “View queries”, “Refresh”).

---

## Typography

**Characteristics:** Humanist sans-serif, very high legibility at all sizes. Soft curves + precise geometry → technical but friendly. Works for both marketing headlines and dense dashboards.

| Use | Style |
| :--- | :--- |
| **Headlines** | Large, bold, confident. Prefer sentence-case. |
| **Body** | Regular/light weights, generous line height. |
| **UI & numbers** | Clear, neutral, optimized for data readability (tabular-nums where appropriate). |

**Implementation:** The app uses **Inter** (via `next/font`) as `--font-sans` — humanist sans, high legibility. Headings: `font-bold tracking-tight`. Scores/KPIs: `text-2xl`–`text-6xl font-bold tabular-nums`. Body: `text-sm` or `text-base` with comfortable line-height.

---

## Colour

**System:** Minimal and expressive.

| Role | Usage |
| :--- | :--- |
| **Black / near-black** | Primary backgrounds (`--bg`). |
| **White** | Primary text on dark; dominant in light contexts. |
| **Cool greys** | UI structure, dividers, secondary text (zinc/slate). |
| **Accent & gradient** | Signature multi-colour gradient (purples, blues, pinks, oranges). Use **sparingly**: hero sections, illustrations, highlights, key CTAs. Accents guide attention; they never overwhelm content. |

**Effect:** Trustworthy and clean (finance) + modern and creative (tech). Instantly recognizable.

**Tokens:** See `src/app/globals.css` for `--accent-*` and gradient variables. Use semantic tokens (e.g. `--color-score`, `--color-success`) for consistency.

---

## Brand personality

- **Developer-first** — Calm, confident, quietly powerful.
- **“Invisible infrastructure”** — Useful and reliable, not flashy.
- **Visual system:** Lots of white space, strong typographic hierarchy, rounded UI components, subtle motion and depth.
- **Imagery:** Prefer realistic product mockups over abstract hype. Partner logos neutral/monochrome. Illustrations technical, modular, abstract.

---

## Component rules

### Cards & containers

- **Background:** `bg-zinc-900/50` or `bg-zinc-800/50` for elevation.
- **Border:** `border border-zinc-700/50`.
- **Radius:** `rounded-xl` for cards; `rounded-lg` for buttons and inputs.
- **Padding:** Generous (`p-4`–`p-8`).

### Data & scores

- **Primary score (e.g. Visibility Score):** Large, bold, tabular-nums. Example: `text-6xl font-bold tabular-nums text-white`.
- **Secondary metrics:** Slightly smaller, `text-zinc-300` or `text-zinc-400`.
- **Trend (positive/negative):** Use semantic green/red with low saturation: `text-emerald-400`, `text-red-400`, or background pills `bg-emerald-500/20`, `bg-red-500/20`.

### Insight + action

- Every **insight** (e.g. “This URL has low avg position”) should be paired with an **action** (e.g. “Optimize this page” or “View queries”).
- **Action buttons:** Clear label, medium emphasis. Use `rounded-lg`, accent or `bg-zinc-700` with hover state. Prefer `font-medium`.

### Charts

- Charts are heroes: give them space. Use Tremor (or Recharts) with the same cool grey grid and accent colours.
- Keep legends and labels legible; avoid decorative clutter.

### Motion

- **Subtle:** Prefer short, low-amplitude transitions (e.g. 200ms opacity/transform). Use sparingly for state changes and micro-interactions.
- Framer Motion: use for route/range transitions and key metric entrances; don’t over-animate.

---

## Quick checklist for new components

- [ ] Background and borders use zinc/slate tokens (no random hex).
- [ ] Headlines are bold and hierarchy is clear.
- [ ] Numbers/scores use bold + tabular-nums where appropriate.
- [ ] Every insight has a corresponding action (button or link).
- [ ] Accent/gradient used sparingly (CTAs, highlights, not whole screens).
- [ ] Rounded corners and generous padding.
- [ ] Motion is subtle and purposeful.

---

## Tokens reference (`globals.css`)

- **Background:** `--bg`
- **Foreground:** `--fg`
- **Muted / secondary:** `--muted`
- **Accent:** `--accent`, `--accent-*` (gradient stops)
- **Semantic:** `--success`, `--danger`
- **Font:** `--font-sans`

Use these in Tailwind via `bg-[var(--bg)]`, `text-[var(--fg)]`, etc., or extend `tailwind.config` with theme colors that reference the same variables.
