# Griot

A privacy first PWA that alerts people when a threat could hit their money, and tells them what to do. Open source, except the admin console and abuse rules.

## Docs

- [README.md](README.md): running and testing
- [DEPLOY.md](DEPLOY.md), [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), [LOADTEST.md](LOADTEST.md), [TODO.md](TODO.md)
- [design-system/](design-system/): colours, type, spacing and voice. `tokens.json` is the source of truth for every UI value

When a design decision changes during building, update the doc in the same change.

## Stack

Next.js, TypeScript, Tailwind and Lucide on Vercel, with Postgres (`postgres` package, raw SQL migrations in `db/migrations/`). Docker runs the local database. Service worker in `public/sw.js`.

## Skills

- `griot-ui` (ours): the design rules. Always use it for UI work
- `frontend-design`: the look of every screen
- `react-best-practices` (Vercel): follow when writing or reviewing React or Next.js code
- `web-design-guidelines` (Vercel): run on finished screens to check usability and accessibility
- `webapp-testing` (Anthropic): Playwright checks that screens work in a real browser

## Working in the code

- Next.js 16 has breaking changes. Before writing Next.js code, read the relevant guide in `node_modules/next/dist/docs/`
- Node is installed with nvm. If `node` isn't found, use `~/.nvm/versions/node/v24.17.0/bin`
- Check changes with `npm test && npm run typecheck && npm run lint && npm run build`
- `app/tokens.css` is generated: change `design-system/tokens.json` and run `npm run design:sync`

## Rules

- Profiles stay on the device. The server may only receive a device's country and types of money, for alert targeting, and only when alerts are on. Never names, balances, wallet addresses or how someone earns
- Usage is counted only as anonymous daily totals (`lib/usage.ts`): no device ID, IP or profile
- Anything that adds data to the server updates PRIVACY.md in the same change
- Words stay short: a 7 year old should manage every screen
- An alert never contains a wallet address, a recovery word request or an instruction to send funds. `lib/safety.ts` enforces this
- The app only shows alerts sealed with our key (`lib/signing.ts`). `ALERT_SIGNING_KEY` never goes on the public app's hosting
- A rumor can never reach level 3
- Risk, report and feed logic in `lib/` stays pure and tested; components only read and call it
- Code comments: short, one line, plain English
