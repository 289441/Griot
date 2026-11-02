# Griot design system

Adapted from the Corper Shun! design system. Rounded, soft and easy to read, for people on budget Android phones in harsh sunlight, and just as clear on a desktop. Calm every day, so the rare alarm stands out.

`tokens.json` is the source of truth for every colour, radius, shadow and size. `npm run design:sync` turns it into `app/tokens.css`. Never edit that file, and never hardcode a colour in a component.

## Themes

| Theme | When | Feel |
|---|---|---|
| Day | The device is in light mode | Soft green ground, white cards, green actions |
| Night | The device is in dark mode | Deep blue, lamp orange actions |

Fonts, shapes, spacing and layout are the same in both. Only the light changes. Meaning colours never change role. Any section can be night on its own with `data-theme="night"`, which the level 3 alarm will use.

## Type

- **Baloo 2** (`font-display`) for the risk level, titles and headings.
- **Plus Jakarta Sans** for everything else. Running text is 16px, and never below 14px except labels.
- **Numbers** use the `num` utility so values never jitter.
- **Labels** use the `label-tag` utility: 12px bold uppercase, for short labels only.

## Shapes and depth

- `rounded-pill` for buttons, inputs and the dock. `rounded-card` for cards and sheets. `rounded-bubble` for list rows. `rounded-chip` for small tags.
- No sharp corners, and no thick borders. A 1px `ring-line` at most.
- `shadow-elev-1` at rest, `shadow-elev-2` for sheets, the dock and hover.
- `bg-sunken` inside a card.

## Colour jobs

| Role | Token |
|---|---|
| Behind full screens | `ground` |
| Cards | `surface` |
| One primary action per screen | `accent`, text is `on-accent` |
| High risk, level 3, destructive | `danger`, `risk-high` |
| Medium risk, level 2 | `warn`, `risk-medium` |
| Low risk, level 1, links | `info`, `risk-low` |

The word always shows beside the colour, because many people are colour blind.

## Motion

Soft, never glitchy. Press scales to 0.97. Hover lifts 1px. Big moments pop in. Animate `transform` and `opacity` only, and respect reduced motion.

## Voice

Plain English in sentence case, at notification length. Titles and buttons are 1 to 4 words where possible. Calm and direct, never dramatic, even at level 3.
