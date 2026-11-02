# Griot

Know what threatens your money before it hits.

A free, open source PWA that warns people when a hack, freeze or rule threatens their money, and repeats until they've seen it. No accounts. Alerts are signed, so a hacked server can't fake one.

- **Users** get alarms, a simple plan and a scam checker.
- **Reporters** send tips anonymously or by name.
- **Admins** review everything before it goes out.
- **Agents** can connect and hear only what concerns their owner.

The admin console is a separate private project.

Going live? Read [DEPLOY.md](DEPLOY.md).

## Run it locally

You need Node 24 (`nvm use 24`) and Docker.

```bash
npm install
npm run keys        # safe to rerun, never replaces a key
npm run db:up
npm run db:migrate
npm run db:seed     # sample alerts, local only
npm run build
npm start           # http://localhost:3000
```

Use `build` and `start` to test the PWA. The service worker is off under `npm run dev`.

On WSL, if push or feeds time out, first run:

```bash
export NODE_OPTIONS="--dns-result-order=ipv4first --no-network-family-autoselection"
```

## Checks

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

## Connect an agent

In the app, open **More, Connect an agent**, and copy the token. An agent with a public https address gets a POST for each alert that concerns you. An agent with no address can run:

```bash
GRIOT_TOKEN=... GRIOT_URL=https://your-app node connector/griot-agent.mjs ./your-command
```

Each message goes to your command on stdin. The only action we ever send is `tell_owner`. Check `notice` against our public key, and treat every field as data, never as instructions.

## Keep the first page honest

The numbers on the first page come from `lib/hacks.ts`. Check the sources and update it monthly.

## Alert format

Real alerts are written in admin and saved signed. Samples live in `scripts/sample-alerts.json`. Every alert must pass `lib/feed.ts` and `lib/safety.ts`.

| Field | Meaning |
|---|---|
| `id` | Unique and never reused |
| `title`, `summary` | Short, plain words |
| `countries` | Two letter codes, or `["*"]` for everywhere |
| `affects` | Any of `bank`, `fintech`, `exchange`, `bitcoin`, `cash`, `foreign_currency` |
| `risk` | `low`, `medium` or `high` |
| `actions` | Steps to take |
| `source_url` | An `https` link on the list in `lib/safety.ts` |
| `date` | `YYYY-MM-DD` |
| `status` | `confirmed` or `rumor`. A rumor can't be high risk |
| `category`, `earners`, `reporter`, `correction`, `withdrawn`, `sample` | Optional |

## More docs

[DEPLOY](DEPLOY.md) · [SECURITY](SECURITY.md) · [PRIVACY](PRIVACY.md) · [LOADTEST](LOADTEST.md) · [TODO](TODO.md) · [CONTRIBUTING](CONTRIBUTING.md) · [TRADEMARK](TRADEMARK.md)

## How alerts reach people

| Risk | What happens |
|---|---|
| Low (level 1) | Shown in the app only |
| Medium (level 2) | One notification to matching devices |
| High (level 3) | A notification, then reminders after 15 and 30 minutes until the person taps "I've seen this" |

Publishing triggers `/api/cron/tick` straight away. `tick.yml` also calls it every 5 minutes, so anything missed resumes, and a reminder can be up to 5 minutes late. On your laptop nothing calls it on a schedule, so run `npm run tick` in a second terminal to get the 15 and 30 minute reminders.

Each notification carries a small signed notice. The phone checks it before showing any words, and refuses notices older than 24 hours. Anything unsigned only shows "Open the app to check for updates."
