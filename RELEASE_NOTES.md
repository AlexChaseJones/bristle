# Bristle 0.2.1 Beta 1

This patch fixes Postman collection discovery when Postman returns an HTTP 500 for a workspace. It keeps the 0.2 features and provides signed Mac downloads for Apple Silicon and Intel.

## Install

- **Apple Silicon (M-series):** download `Bristle-0.2.1-mac-arm64.dmg`.
- **Intel Mac:** download `Bristle-0.2.1-mac-x64.dmg`.
- Quit Bristle, open the DMG, replace Bristle in Applications, and launch through Finder.

Both the app and disk image are Developer ID-signed, Apple-notarized and stapled. Updates are manual. The SHA-256 manifest identifies every other release asset.

## Fixed in 0.2.1

- Recover from Postman workspace-listing server errors through the account collection index.
- Verify each collection belongs to the selected workspace before offering it for import; keep environments scoped to that workspace.
- Show collection-discovery progress and retain cancellation. Authentication and permission failures still stop with an error.

To use the fix, open guided Postman migration, connect with your Postman API key, select the affected workspace, then choose collections. Discovery may take longer when the fallback is needed. Collection sharing is not required for resources your account can access.

## Verification and limits

Application tests and typechecking were intentionally skipped for 0.2.1 at the maintainer's request. No unit, desktop, installed-app or startup suites were run. Prior 0.2.0 passing results do not validate the changed 0.2.1 binaries, and the patched migration has not been exercised end to end.

Compilation, architecture, Developer ID signatures, the expected Apple Team ID, Gatekeeper assessments, accepted notarization submissions and stapled tickets were checked for both installers. Published file hashes match the staged release assets.

Physical Intel hardware, a fresh browser-to-Finder installation, existing-profile/unsigned-to-signed Keychain migration, real-account migration through the patched app, independent security review, native assistive technology and reference-hardware performance certification remain unverified. Earlier memory targets remain unresolved. Windows/Linux downloads and automatic updates are not included.

The IT packet, verification JSON and signing-evidence ZIP identify the exact files and scope. Application source revision: `b096f19d0d7de621ee026c0329e80989667dbab5`. The source stays private; this public tag identifies the publication documents.

**[Get started](https://bristlebristle.app/getting-started/) · [Beta guide](https://bristlebristle.app/beta-guide/) · [Report a bug](https://github.com/AlexChaseJones/bristle/issues/new?template=bug-report.yml)**

Private support/security: alexchasejones@icloud.com. Remove sensitive data from public reports.
