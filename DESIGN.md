# Design Brief

## Direction

Forest Harvest — a light, productivity-first agricultural management dashboard for AgriVision Pro, a sustainable-development platform for Malawi.

## Tone

Clean, grounded, and trustworthy: white surfaces, deep forest green brand color, light grey borders, and a restrained yellow accent reserved for alerts and highlights — a calm operational tool for farm managers.

## Differentiation

The forest-green identity plus a nature-themed login and leaf-tinted surfaces makes an agricultural SaaS feel organically connected to the land it manages, not like a generic admin panel.

## Color Palette

| Token      | OKLCH        | Role                              |
| ---------- | ------------ | --------------------------------- |
| background | 0.985 0.004 150 | near-white canvas with green tint |
| foreground | 0.18 0.03 145  | dark forest text                  |
| card       | 1 0 0         | white elevated surfaces           |
| primary    | 0.42 0.13 145 | deep forest green (#1B5E20/#2E7D32) |
| accent     | 0.93 0.03 145 | soft green hover tint             |
| muted      | 0.95 0.01 145 | light grey fills                  |
| warning    | 0.82 0.15 90  | yellow alerts/highlights          |
| success    | 0.55 0.16 150 | positive green                    |

## Typography

- Display: Space Grotesk — headings, hero, KPI values, logo
- Body: DM Sans — UI labels, tables, paragraphs
- Mono: JetBrains Mono — IDs, currency figures, timestamps
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold tracking-tight`, label `text-xs font-semibold uppercase tracking-widest`, body `text-sm md:text-base`

## Elevation & Depth

Cards sit on white with subtle green-tinted shadows (`shadow-subtle`/`shadow-elevated`); the primary action and sidebar active state carry a forest-green gradient for depth without heaviness.

## Structural Zones

| Zone    | Background              | Border        | Notes                                   |
| ------- | ----------------------- | ------------- | --------------------------------------- |
| Sidebar | `bg-sidebar` white      | `border-r`    | grouped by module (Agriculture, Sales & Finance) |
| Header  | `bg-card` white         | `border-b`    | app logo + user profile (Arthur, Super Admin) |
| Content | `bg-background`         | —             | alternate `bg-muted/30` sections        |
| Footer  | `bg-muted/40`           | `border-t`    | branding + copyright line               |

## Spacing & Rhythm

Generous section gaps (p-6/p-8) around KPI cards and charts, with tight micro-spacing (gap-2/3) inside cards for information density; consistent 8px grid.

## Component Patterns

- Buttons: rounded-lg, forest green primary, gradient hover, yellow only for alert actions
- Cards: rounded-xl white with `shadow-subtle`, `border-border`
- Badges: rounded-full, green or yellow tinted for status
- KPI cards: white, green line icon, large display value + delta

## Motion

- Entrance: subtle fade-up on cards (200–300ms ease-out)
- Hover: gentle lift via `shadow-elevated` + translate-y (150ms)
- Decorative: soft pulse on live/weather status dots

## Constraints

- Token-only styling — no raw hex or arbitrary Tailwind colors in components
- MWK currency formatting throughout
- Light mode is primary; dark mode tuned, not inverted
- Yellow reserved for alerts/highlights, never as primary CTA

## Signature Detail

The leaf-tinted white canvas and forest-green gradient active states unify the sidebar, KPI cards, and login page into one organic "grown, not generated" identity.
