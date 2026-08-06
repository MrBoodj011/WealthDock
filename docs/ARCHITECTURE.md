# Architecture

## Boundaries

WealthDock separates the application into four layers:

1. **Domain** — versioned types, schemas and safe demo data.
2. **Finance engine** — pure balance, cashflow and budget calculations.
3. **Client application** — views, forms and explicit user actions.
4. **Local vault** — IndexedDB persistence in plain or encrypted-envelope mode.

The Next.js server renders the static shell and security headers. It does not
receive or persist the user's financial dataset.

## Data lifecycle

1. The browser opens the `wealthdock` IndexedDB database.
2. A plain vault is validated before use, or an encrypted envelope is unlocked.
3. React holds the active dataset in memory.
4. Changes are validated at import boundaries and persisted after a short debounce.
5. Exports are generated entirely in the browser.

## Encryption

Encrypted mode uses PBKDF2-SHA256 with 310,000 iterations to derive an AES-256-GCM
key from the passphrase. Each write uses a random 128-bit salt and 96-bit IV.
The passphrase and derived key are not persisted. Encryption provides
confidentiality and authentication for data at rest; it does not protect an
already unlocked browser session.

## Schema evolution

`schemaVersion` is currently `1`. Future versions must provide an explicit,
tested migration. Import code rejects unknown or incomplete shapes rather than
guessing.

## Network policy

The default application makes no financial-data API calls. Any future sync or
market-data adapter must be opt-in, isolated behind an interface and documented
in the threat model.
