# Contributing

Thank you for helping protect people's money.

1. Follow the README to run it locally.
2. Keep words short. If a 7 year old can't follow a screen, it's too long.
3. Read `CLAUDE.md` for the rules, and `design-system/` for the look.
4. Before opening a pull request, run:

```bash
npm test && npm run typecheck && npm run lint && npm run build
```

Changes to `lib/signing.ts`, `lib/safety.ts`, `server/`, `sw/` or `app/api/` need review from two maintainers.

Found a security problem? See [SECURITY.md](SECURITY.md) and report it privately.
