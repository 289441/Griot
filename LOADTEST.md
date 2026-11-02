# Load testing

## How it was tested (1 Nov 2026, one laptop under WSL, app and database on the same machine)

5,000 fake devices with real encryption keys, sending to a local stand in for the push service that answers in 60ms.

| Test | Result |
|---|---|
| Level 3 alert to 5,000 devices | 18 seconds, all delivered, no errors |
| 5,000 reminders | 17 seconds |
| Feed, 200 connections, no CDN | 109 requests a second, 3.7 second worst case, no errors |
| App page, 200 connections, no CDN | 181 requests a second, 2.4 second worst case, no errors |
| Health, 50 connections | 230 requests a second |

## What this means

- Delivery does about 250 devices a second on this machine. One run has a 45 second budget, so about 11,000 devices a run. Beyond that the rest wait for the next tick, so nobody is lost.
- Page and feed numbers are worst case, with no CDN. Vercel and Cloudflare serve both from their edge, so a crowd barely touches the app.
- Real push services are slower and less predictable than the stand in.

## Not tested

A real run on hosted infrastructure, or real push services at volume. Repeat this on your hosted setup with thousands of real or test devices before a big launch.

## If you grow

Run tick more often, raise `BATCH_SIZE` in `server/send.ts`, or move delivery to a small always on worker.
