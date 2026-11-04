# Bristle 0.1.11 Beta 1

Bristle is a local API client that groups open requests by collection, preserves recoverable drafts, and makes environment selection explicit. This public Mac beta is free to download and use without an app account.

## Install

- **Apple Silicon (M-series):** download `Bristle-0.1.11-mac-arm64.dmg`.
- **Intel Mac:** download `Bristle-0.1.11-mac-x64.dmg`.
- Open the DMG, copy Bristle into Applications, and launch through Finder.

Both app and DMG are Developer ID-signed, Apple-notarized, and stapled. Updates are manual. The attached SHA-256 manifest identifies every other release asset.

## In this build

- Collection-specific working sets, previews, recoverable drafts, and explicit saves.
- Named environments, local secret references, and header/variable completion.
- OpenAPI/Postman import, reviewed scripting, response comparisons, and local mocks.
- The approved quiet visual design and simplified hedgehog icon.

These are the same verified signed binaries previously distributed in the private beta. The app still shows its existing “ALPHA” badge. The public release updates distribution and documentation, not application behavior.

## Verification and known limits

Both Mac architectures passed 159 domain tests, 31 source workflows, one installed startup check, and 26 installed workflows. Signature, Gatekeeper, notarization, and stapled-ticket checks passed. Skipped cases are excluded from these counts.

Fresh browser-to-Finder installation on a personal Mac, unsigned-to-signed Keychain migration, independent security review, native assistive-technology review, and reference-hardware performance certification remain unverified. Earlier memory targets remain unresolved. Windows/Linux downloads and automatic updates are not included. Signing is not employer approval.

The attached IT packet, verification JSON, and signing evidence describe the scope. Original application source revision: `c6eebc08d3a88e033849f1a4c325fbb27a4ecd5d`. The app source stays private; this public tag points to publication documents.

**[Get started](https://bristlebristle.app/getting-started/) · [Beta guide](https://bristlebristle.app/beta-guide/) · [Report a bug](https://github.com/AlexChaseJones/bristle/issues/new?template=bug-report.yml)**

Private support/security: alexchasejones@icloud.com. Remove sensitive data from public reports.
