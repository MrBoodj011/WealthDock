# Security policy

## Supported versions

Security fixes are applied to the latest tagged release and `main`.

## Reporting a vulnerability

Use GitHub's private vulnerability reporting feature on this repository. Include:

- affected version and browser;
- a minimal reproduction;
- security impact;
- suggested remediation, if known.

Do not include real financial data, access tokens or passphrases. Please allow
the maintainer a reasonable remediation window before public disclosure.

## Scope

Relevant reports include vault encryption flaws, unsafe imports, cross-site
scripting, unauthorized network transmission, backup corruption and supply-chain
risks. Social engineering and attacks requiring a fully compromised operating
system are generally out of scope.

## Secret handling

WealthDock requires no application secrets. Never commit `.env*`, private data,
browser profiles or generated vault files. CI runs secret and dependency scans.
