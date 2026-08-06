# Contributing to WealthDock

Thank you for helping build private, understandable personal finance software.

## Before opening a pull request

1. Search existing issues and discussions.
2. Create a focused branch from `main`.
3. Keep financial data and secrets out of fixtures, screenshots and logs.
4. Add or update tests for every behavior change.
5. Run the complete local check:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Development principles

- Local-first and no-network behavior is the default.
- A feature must not weaken data portability or privacy.
- Stored-data changes require a schema version and migration plan.
- Security-sensitive actions must be explicit and reviewable.
- UI changes must work with keyboard navigation, reduced motion and mobile widths.
- Dependencies need a clear purpose and should not add telemetry.

## Commits and pull requests

Use short imperative commit subjects, for example `Add QIF transaction importer`.
A pull request should explain the problem, the chosen solution, test evidence,
privacy impact and screenshots when the interface changes.

## Security reports

Do not file public issues for vulnerabilities. Follow [SECURITY.md](SECURITY.md).
