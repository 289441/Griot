# TODO

Only what is still open. When something is done, delete it.

## Needs you, before launch

- Have a lawyer read the Privacy and Terms pages, and the reporting rules
- Set your own admin password and login code on the live admin
- Find your first reporters, and a second admin when you can
- Confirm the latest figures in `lib/hacks.ts`. Several are early estimates from single sources
- Test on a real iPhone and a real Android phone, from the installed app
- Replace `mailto:change-me@example.com`
- Decide the launch countries. The bot has no country sources yet (Nigeria's central bank had no working feed)

## Before going big

- Repeat the load test on real hosting (LOADTEST.md)
- Move the signing key to a hardware device or separate signer
- Two admins for every level 3 alert, once you have a second admin
- Add a passkey login for admin
- Put admin behind Cloudflare Access, and add CDN rate limits
- Watch how reliable the GitHub schedules are in practice
- Scheduled clean up of old rejected reports

## Next milestones

- Native app, for an alarm that can break through silent mode
- Nostr: publish alerts to relays and read them as a fallback
- Agents that can broadcast a transaction the user signed in advance
- More languages
