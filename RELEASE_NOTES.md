# Bristle 0.2.0 Beta 1

Bristle 0.2 adds clearer variable previews, keyboard-friendly controls, persistent request ordering and guided Postman migration. Both signed Mac downloads are available without an app account.

## Install

- **Apple Silicon (M-series):** download `Bristle-0.2.0-mac-arm64.dmg`.
- **Intel Mac:** download `Bristle-0.2.0-mac-x64.dmg`.
- Open the DMG, copy Bristle into Applications, and launch through Finder.

Both the app and disk image are Developer ID-signed, Apple-notarized and stapled. Updates are manual. The attached SHA-256 manifest identifies every other release asset.

## Changes in 0.2

- Inline variable decorations and active-environment previews keep nested secrets masked.
- Themed dropdowns support keyboard selection and Escape; tabbed dialogs retain their height.
- Drag and keyboard request reordering persists across restart and portable export/import.
- New collections default to local app data, with a custom folder still available.
- Guided Postman migration offers preview, workspace selection, cancellation and partial retry. File import remains available.
- Large-response previews avoid unnecessary whole-buffer copies. Script execution deadlines start after worker initialization.

## Verification and limits

The exact application revision passed 204 unit tests and 38 source desktop workflows. Each signed installer passed a fresh-profile startup check and 31 installed workflows. Apple Silicon ran natively; Intel ran through Rosetta 2 on the same Apple Silicon Mac. Intel coverage combines retained passes, test wait and selector corrections, and the remaining workflows in separate batches. Earlier failed attempts, including a zoom-dialog closure during reported operator interaction before a complete focused pass, are preserved in private evidence; these counts do not claim a single uninterrupted passing Intel suite. Skipped cases are excluded.

Developer ID signatures, expected Apple Team ID, Gatekeeper assessments, accepted notarization submissions and stapled tickets passed for both architectures. The published binaries match the private verified release byte for byte.

Physical Intel hardware, a fresh browser-to-Finder installation, existing-profile/unsigned-to-signed Keychain migration, real-account Postman migration, independent security review, native assistive technology and reference-hardware performance certification remain unverified. Earlier memory targets remain unresolved; this is not a claim of lower memory use than other clients. Windows/Linux downloads and automatic updates are not included.

The IT packet, verification JSON and signing-evidence ZIP identify the exact files and scope. Application source revision: `3470ee70468b4b478f511a8ee3194c5a1515fb9e`. The source stays private; this public tag identifies the publication documents.

**[Get started](https://bristlebristle.app/getting-started/) · [Beta guide](https://bristlebristle.app/beta-guide/) · [Report a bug](https://github.com/AlexChaseJones/bristle/issues/new?template=bug-report.yml)**

Private support/security: alexchasejones@icloud.com. Remove sensitive data from public reports.
