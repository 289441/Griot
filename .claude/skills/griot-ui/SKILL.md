---
name: griot-ui
description: Design system and rules for every Griot screen, built with Next.js, Tailwind and Lucide. Use when building, styling or reviewing any UI component or screen, including the risk meter, alerts, the report, reporter forms and the level 3 alarm.
---

# Griot UI

`design-system/README.md` and `design-system/tokens.json` are the source of truth. Read them before UI work. Never invent a colour or font outside them. Use `frontend-design` for visual quality and `react-best-practices` for performance alongside this skill.

## Rules

- All colours, radii and shadows come from tokens. Never hardcode hex values in components.
- Shared class strings live in `lib/styles.ts` (`btn`, `btnPrimary`, `btnSevere`, `card`, `riskTag`). Reuse them.
- `accent` appears once per screen as an action.
- Risk shows as a word on a tag. Colour is never alone.
- Lucide icons are imported one by one, always beside a word or with `aria-hidden` plus a label.
- Design at 360 × 800 first, then scale up. Touch targets are at least 44 × 44 px, and primary actions sit in thumb reach.
- Body text is 16px, and never below 14px except labels.
- Animate `transform` and `opacity` only. Respect `prefers-reduced-motion`.
- Everything works by touch alone, and by mouse and keyboard alone.

## Every screen must have

1. One clear primary action
2. Visible state: what's happening now and what changed
3. Strong hierarchy: the most important thing is the biggest
4. Feedback for every tap
5. Works at 360px wide on touch and at 1440px wide with mouse and keyboard
