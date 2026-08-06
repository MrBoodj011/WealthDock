# Threat model

## Assets

- Account names, balances and transaction history.
- Goals, debts, notes and tags.
- Vault passphrases and encrypted backups.
- Integrity and availability of the local dataset.

## Trust boundaries

- The operating system and browser profile are trusted while unlocked.
- Imported files are untrusted and validated before use.
- Browser extensions, downloaded scripts and cloud drives are external systems.
- GitHub Actions and npm dependencies are supply-chain boundaries.

## Threats and controls

| Threat                               | Control                                                         |
| ------------------------------------ | --------------------------------------------------------------- |
| Secret committed to source           | No runtime secret requirement, ignore rules and secret scanning |
| Malformed or oversized imported data | Versioned Zod schema, bounded fields and explicit errors        |
| CSV formula injection                | Formula-leading cells are prefixed during export                |
| Local disk inspection                | Optional AES-256-GCM encrypted vault                            |
| Backup tampering                     | GCM authentication rejects modified ciphertext                  |
| Framing and content sniffing         | CSP, frame denial and content-type security headers             |
| Dependency compromise                | Lockfile, Dependabot, CodeQL and CI checks                      |
| Accidental remote transmission       | No analytics and a self-only default CSP `connect-src`          |
| Lost browser profile                 | Explicit JSON and encrypted backup exports                      |

## Residual risks

- Malware or a hostile extension can inspect an unlocked page.
- Weak passphrases can be guessed offline from a stolen envelope.
- Browser storage can be cleared by the user or operating system.
- The application is not a regulated bank ledger or financial advisor.
