# Deploying Griot

Two apps share one Postgres database:

| App | Where | Who sees it |
|---|---|---|
| Public app (this repo) | `griot.dunsin.xyz` | Everyone |
| Admin console (private repo) | A separate address, like `admin.griot.dunsin.xyz` | Only you |

The signing key lives **only** on the admin app.

## Step 1: Create your keys, on your laptop

```bash
npm install
npm run keys
cd ../griot-admin
npm install
npm run setup
npm run password
npm run totp      # scan the printed key with an authenticator app
```

Change `VAPID_SUBJECT` in `.env.local` to `mailto:you@yourdomain.com`. Keep a copy of both `.env.local` files in a password manager. Never commit them.

## Step 2: Create the database

Any Postgres 15 or newer works. Neon or Supabase are easy with Vercel. RDS suits AWS. Turn on daily backups.

Run this once, with your real database address:

```bash
DATABASE_URL="postgres://..." npm run db:migrate
cd ../griot-admin
DATABASE_URL="postgres://..." npm run db:migrate
```

Do **not** run `db:seed` in production. It loads the sample alerts.

## Option A: Vercel (easiest)

**Public app**

1. Push this repo to GitHub and import it on Vercel.
2. Add these settings: `DATABASE_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `NEXT_PUBLIC_ALERT_PUBKEY`.
3. Deploy. `vercel.json` schedules the weekly report.
4. In Vercel, open Settings, Domains and add `griot.dunsin.xyz`. In Cloudflare DNS, add a `CNAME` named `griot` pointing to the value Vercel shows, set to **DNS only** (grey cloud), so Vercel can issue the HTTPS certificate.

**Admin app**

1. Push the admin folder to a **private** repo and import it as a second Vercel project.
2. Add: `DATABASE_URL`, `ALERT_SIGNING_KEY`, `ADMIN_PASSWORD_HASH`, `SESSION_SECRET`, `BOT_SECRET`, `TOTP_SECRET`, `CRON_SECRET`, and `APP_URL` set to your public address.
3. Put Vercel Authentication or Cloudflare Access in front of it, so strangers never reach the login page.

**GitHub schedules**

Vercel's free plan runs cron once a day, so GitHub wakes the bot and delivery. In the public repo, open **Settings, Secrets and variables, Actions** and add `APP_URL`, `CRON_SECRET`, `ADMIN_URL` and `BOT_SECRET`.

GitHub schedules can run late, and stop after 60 days with no repo activity. Check them in the Actions tab. For exact timing, use Vercel Pro or any uptime service that calls `/api/cron/tick` with the secret.

## Option B: AWS or any server with Docker

```bash
docker build -t griot \
  --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=... \
  --build-arg NEXT_PUBLIC_ALERT_PUBKEY=... .

docker run -d -p 3000:3000 --restart unless-stopped \
  -e DATABASE_URL=... -e VAPID_PRIVATE_KEY=... -e VAPID_SUBJECT=... \
  -e CRON_SECRET=... -e NEXT_PUBLIC_VAPID_PUBLIC_KEY=... -e NEXT_PUBLIC_ALERT_PUBKEY=... \
  griot
```

Build the admin the same way from its own folder, on port 3001. On AWS, run them on EC2 or App Runner, with RDS for the database and secrets in Parameter Store.

You must add HTTPS in front, because PWAs and push need it. Cloudflare is the simple choice, and it also adds caching and rate limits. Replace the GitHub schedules with cron on the server if you prefer:

```cron
*/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/tick
*/10 * * * * curl -fsS -X POST -H "Authorization: Bearer $BOT_SECRET" https://your-admin/api/poll
0 9 * * 1 curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://your-app/api/cron/weekly
```

## After deploying, check

- [ ] `https://your-app/api/health` says `"status":"ok"`.
- [ ] The app installs on Android and iPhone.
- [ ] Log in to admin with your password and code.
- [ ] Publish a test alert, see it arrive, then withdraw it.
- [ ] **Run bot** fills the queue.
- [ ] Add an uptime monitor on `/api/health`.
- [ ] Restore a backup once. A backup you've never restored is a hope, not a backup.
- [ ] Update `lib/hacks.ts` with this month's real figures.

## When something goes wrong

| Problem | Fix |
|---|---|
| Health says `unreachable` | Check the database and `DATABASE_URL` |
| No notifications | Check `VAPID_*` settings, then the tick schedule |
| Delivery paused | Call `/api/cron/tick`. Waiting sends resume where they stopped |
| Bad alert published | Admin, Published, open it, send a correction |
| Locked out of admin | Ten wrong tries locks login for 15 minutes |
| Lost a server secret | Replace it where it's set, then redeploy |
| Data damaged | Restore the database to a time before it happened |

**Signing key leaked:** act fast. Stop the admin app, make a new key, update `ALERT_SIGNING_KEY` and `NEXT_PUBLIC_ALERT_PUBKEY`, redeploy both apps, and re sign real alerts. Tell users publicly, because attackers could have signed fake alerts.

**Never change the VAPID keys** unless they leaked, because every device would need to turn alarms on again.

## Updating

Run new migrations before deploying new code. Every push to `main` deploys on Vercel, and you can roll back from its Deployments page.
