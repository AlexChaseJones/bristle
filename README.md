# Bristle

Your API work, in focus. A local API client with collection-specific working sets, recoverable drafts, and named environments.

**[Website](https://bristlebristle.app) · [Download the Mac beta](https://github.com/AlexChaseJones/bristle/releases/tag/v0.2.1-beta.1) · [Get started](https://bristlebristle.app/getting-started/) · [Report a bug](https://github.com/AlexChaseJones/bristle/issues/new?template=bug-report.yml)**

Free during beta. No app account or payment required. Apple Silicon and Intel downloads are Developer ID-signed and Apple-notarized. Updates are manual.

This repository contains the public website, release documentation, downloadable beta assets, and feedback tracker. **It does not contain the desktop application's source code**, which remains private. The public release tag identifies publication documents; the verification record separately identifies the app source revision.

## Run the website locally

Node 22 or newer is required. Install the locked YAML parser used by release validation with `npm ci --ignore-scripts`.

```sh
npm run check
npm run preview
```

Open `http://127.0.0.1:4173`. The site builds to `dist/`; preview is loopback-only. The site uses plain HTML/CSS, no client JavaScript, and no remote fonts or analytics.

## Beta feedback

Follow the [beta guide](https://bristlebristle.app/beta-guide/) with one collection and test credentials. Tell us when you switch back to Postman and why.

Issues are public. Remove secrets, customer data, and internal endpoints before reporting. Send private support/security reports to [alexchasejones@icloud.com](mailto:alexchasejones@icloud.com). No response SLA is established.

## Evidence and limitations

The release includes an IT review PDF, final SHA-256 checksums, verification JSON, and signing evidence. [Release notes and limits](https://bristlebristle.app/releases/) describe what has and has not been verified. Signing and notarization do not constitute employer approval.

The app and website retain the MIT license. Dependency notices are bundled inside the app. [Maintenance and release procedure](MAINTENANCE.md) explains publication, rollback, and domain configuration.

### Optional transfer for a slow upload connection

The manual **Transfer verified release assets** workflow copies installer and updater bytes to an existing public draft. It does not build applications, run desktop tests, publish a release, or change website metadata. This avoids uploading the same large packages from the release Mac twice.

Create the public draft against the committed publication branch and upload its four small review documents first. Obtain temporary `release-assets.githubusercontent.com` download URLs for the approved private-release installers and updater assets through the authenticated GitHub asset API. Run the workflow against that publication branch with `tag` and `asset_urls` (a JSON array of `{ "filename": "...", "url": "..." }`). Only pass URLs for assets intended for public distribution; never pass account tokens or private test evidence. The runner uses its existing repository-scoped GitHub token to upload.

Every transferred file must match `site/release.json`, the verification record, updater manifests and complete checksums. Existing draft files must match exactly. The workflow leaves the draft unpublished; finish with the existing `npm run release:publish -- --assets DIRECTORY` command, which separately verifies the published private source tag and uploaded bytes. Run `npm run check` to test the transfer input restrictions and release validators.
