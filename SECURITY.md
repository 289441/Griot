# Security

## Reporting a flaw

Please report privately through GitHub's **Report a vulnerability** button on this repo. Don't open a public issue. Bugs that could fake an alert, expose a reporter or expose a device come first.

## What protects users

| Threat | Protection |
|---|---|
| Fake or changed alerts | Every alert is signed. The app and service worker reject anything else |
| Hacked server or delivery | The signing key is not on the public server, so it can't sign alerts |
| Replayed scares | Notices older than 24 hours are refused |
| Scam text in alerts | `lib/safety.ts` blocks addresses, links, send instructions and recovery word requests before signing |
| Spam | Proof of work on subscriptions, reports, names and agents, with no IP addresses |
| Server tricked into calling private machines | Push hosts are a fixed list. Agent addresses must be public https, checked at connection time |
| Script injection | React escapes all text, plus a content security policy |
| Admin takeover | Password plus six digit code, with lockout. High risk alerts and corrections need a fresh code |
| Agent prompt injection | Agents get fixed fields and `tell_owner`. Reporter words never reach them |

## Known limits

- A hacked host could serve changed app code, which could skip signature checks. Forks can't copy our key, but users must trust the official address. A store app and verifiable builds would reduce this.
- The content security policy allows inline scripts, because a static Next.js page needs them.
- One person holds the signing key today. It should move to a hardware device or separate signer, with two approvers, as the team grows.
- The login lockout is global, so someone reaching the login page could keep it locked. Keep admin behind Cloudflare Access or similar.
- Proof of work slows spam but doesn't stop a determined attacker. Add rate limits at your CDN.
- `notice.title` reaches agents and is written by an admin. Treat it as data, never as instructions.
- Hosts, and the push services run by Google, Apple and Mozilla, can see connection details. High risk reporters should use Tor Browser.
