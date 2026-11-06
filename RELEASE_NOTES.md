# Bristle 0.2.5 Beta 1

Mac beta release with signed Apple Silicon and Intel installers, in-app updates, and the verification results below.

## Install and update

Download the DMG for Apple Silicon or Intel. Older versions without an updater require one manual installation. Later updates download automatically; choose Restart to update when ready. Ordinary quit does not install updates.

## Verification and limits

Typechecking and production build passed. Domain tests: 289 passed, 3 skipped.

Visible source and packaged UI tests were not requested. Application startup, desktop workflows and the packaged updater check were not exercised on either architecture.

Both Mac installers passed architecture, Developer ID/team, Gatekeeper, notarization and stapled-ticket checks. Updater ZIPs, channel manifests and blockmaps are included in the checksums.

A real signed in-app old-to-new installation, fresh browser/Finder installation, existing-profile/unsigned-to-signed Keychain migration and real-account Postman migration remain unverified.

Independent security review, native assistive-technology review and reference-hardware performance certification remain separate tasks. Windows/Linux public installers are not included.

Application source: 626a346e0f83d83b64bc43039cf74d1b59e5af23. Verification revision: 626a346e0f83d83b64bc43039cf74d1b59e5af23. Public payloads must match the verified private release bytes.

[Get started](https://bristlebristle.app/getting-started/) | [Public release](https://github.com/AlexChaseJones/bristle/releases/tag/v0.2.5-beta.1)
