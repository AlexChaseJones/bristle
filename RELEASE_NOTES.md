# Bristle 0.2.2 Beta 1

Bristle can now check for updates and download newer Mac releases from inside the app.

## Install this release once

- **Apple Silicon:** download `Bristle-0.2.2-mac-arm64.dmg`.
- **Intel Mac:** download `Bristle-0.2.2-mac-x64.dmg`.
- Quit Bristle, open the DMG, replace Bristle in Applications, and launch it.

Existing users need this one manual installation because earlier versions do not contain an updater. Both Mac applications and disk images are Developer ID-signed, Apple-notarized and stapled.

## In-app updates

- Bristle checks the public GitHub release feed 30 seconds after the workspace opens, then every six hours while running.
- Newer beta and stable releases download automatically. Settings → Updates shows the installed version, status, progress, Check for Updates, and Retry.
- Choose **Restart to update** in Settings or the header when ready. The confirmation explains that active work will stop. Drafts and UI state must be saved successfully before shutdown.
- Ordinary quit does not install an update. Failed checks, downloads or verification leave the running app available and report an error.
- Development builds and other platforms show an unavailable state. No GitHub account or token is needed.

This release includes the 0.2.1 Postman workspace-discovery correction and the existing collection, environment, draft, import and scripting features.

## Verification and limits

Typechecking and the production build passed. Domain tests: **238 passed, 3 skipped**. Source-only desktop fixtures: **7 passed**. Apple Silicon installed checks: **28 passed, 3 platform skips**. Intel installed smoke checks through Rosetta 2: **3 passed, 3 platform skips**.

Architecture, Developer ID identity, Gatekeeper, accepted notarization and stapled tickets were verified for both installers. The updater ZIPs, channel manifests and generated blockmaps are included in the complete SHA-256 manifest. Public payloads match the verified private release bytes.

Slow memory/performance and broad accessibility diagnostics are opt-in and were not run. A real signed old-version-to-new-version in-app installation, physical Intel hardware, a fresh browser-to-Finder installation, existing-profile/unsigned-to-signed Keychain migration, real-account Postman migration, independent security review, native assistive technology and reference-hardware performance certification remain unverified. Earlier memory targets remain unresolved. Windows/Linux public installers are not included.

The IT packet, verification JSON and signing-evidence ZIP identify the exact files and scope. Application source revision: `9a00fd05f35e453280869e23f1d64ce318e6792f`; verification revision: `b91e25db8f59d4a7a2280a19dc3eb8e43d95d8ed`. App source stays private; the public tag identifies the publication documents.

**[Get started](https://bristlebristle.app/getting-started/) · [Beta guide](https://bristlebristle.app/beta-guide/) · [Report a bug](https://github.com/AlexChaseJones/bristle/issues/new?template=bug-report.yml)**

Private support/security: alexchasejones@icloud.com. Remove sensitive data from public reports.
