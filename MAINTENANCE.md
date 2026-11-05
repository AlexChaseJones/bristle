# Maintaining Bristle's public beta

## Boundaries

`AlexChaseJones/bristle` is public: website, documentation, releases, and issues only. `AlexChaseJones/request-grove` remains private and owns app source, tests, signing workflow, and the five Apple signing secrets. Do not copy its Git history or scratch/build directories here.

`site/release.json` is the single input for website version information, download URLs, architecture labels, and binary hashes. `site/pages.mjs` holds page content. The build outputs static pages and a public `release.json`. There are no runtime API calls, account services, cookies, or analytics.

## Change or roll back the website

1. Edit the site and run `npm run check` (Node 22+; run `npm ci --ignore-scripts` first).
2. Preview with `npm run preview`; inspect desktop/mobile, keyboard focus, zoom, and links. Screenshots must contain only synthetic data.
3. Commit and push to `main`. The Pages workflow checks the site, uploads only `dist/`, and deploys after checks pass. Pull requests run checks without deployment.
4. Verify the workflow's exact commit and visit the public HTTPS site.

To roll back, revert the affected website commit and push; the same workflow deploys the reverted content. Do not move app release tags or replace binaries. During an incident, keep a known-good release linked while correcting website metadata.

## Promote a future Mac beta

The publishing CLI requires an authenticated GitHub CLI with read access to the private app repo and write access to this public repo. Authenticate normally with `gh auth login`, or supply credentials through the environment in a trusted local session. Never commit credentials. The website workflow uses its repository-scoped token and cannot read private app releases or sign an app.

1. Build, sign, notarize, and verify both architectures in the private app workflow. Publish a versioned private beta after both jobs pass. Any changed app binary needs a new app version and beta tag.
2. Download that private release to an ignored staging directory, for example:

   ```sh
   gh release download v0.1.12-beta.1 --repo AlexChaseJones/request-grove --dir .release/v0.1.12-beta.1
   ```

3. Update `site/release.json` to the verified version, beta tag, full source commit, final DMG filenames, sizes and SHA-256 hashes. Preserve the explicit source/public repository distinction.
4. Review and update `RELEASE_NOTES.md`, the website's release notes/verification counts, and the staged IT PDF and verification JSON. Public download URLs must point here. Keep original Apple receipts and signing evidence unchanged. The verification JSON must contain `version`, `sourceCommit`, and `artifacts` identifying both filenames, sizes, and hashes.
5. Regenerate the staged `Bristle-VERSION-SHA256SUMS.txt`: SHA-256, two spaces, basename, one entry per asset, excluding the manifest itself. The base assets are the two DMGs, IT PDF, checksum manifest, verification JSON, and signing-evidence ZIP. Updater-enabled releases also require every asset declared in `updates`, as described below. Visually inspect all PDF pages after editing.
6. Check the complete staged package:

   ```sh
   npm run check
   npm run release:check -- --assets .release/v0.1.12-beta.1
   ```

7. Commit and push the publication snapshot on a staging branch. Publish the release before merging the new download metadata to `main`, so the live homepage never points at unpublished assets. The release command targets the current pushed commit.
8. Create/resume a draft and review its exact assets:

   ```sh
   npm run release:draft -- --assets .release/v0.1.12-beta.1
   npm run release:publish -- --assets .release/v0.1.12-beta.1
   ```

   The script checks source release binary digests, local digests, the entire checksum manifest, provenance, and uploaded asset digests. It never uses `--clobber`. Identical published assets are accepted; conflicting, incomplete, or unexpected published assets cause failure. If upload is interrupted, rerun `release:draft` to upload only missing files.
9. Merge the website metadata, verify the Pages deployment, then download all declared public assets without credentials. Compare both DMGs with the approved hashes and all other assets with the manifest. Check the public IT packet links and confirm both architecture buttons work without login.

The public tag identifies a publication commit. The app source SHA is recorded in the verification JSON and release metadata; do not claim the public tag identifies app source code.

## Domain and HTTPS

Canonical host: `bristlebristle.app`. GitHub Pages custom domain: the same. `www` redirects to the canonical host. Porkbun remains the DNS provider; no nameserver change is needed.

Verify ownership under GitHub account Settings → Pages → Add a domain. Add GitHub's exact TXT challenge to Porkbun and complete verification. Keep that TXT record afterward. Configure the repository Pages domain before changing web DNS.

| Type | Porkbun host | Answer |
|---|---|---|
| A | blank (apex) | 185.199.108.153 |
| A | blank (apex) | 185.199.109.153 |
| A | blank (apex) | 185.199.110.153 |
| A | blank (apex) | 185.199.111.153 |
| CNAME | www | alexchasejones.github.io |
| TXT | GitHub-generated challenge host | GitHub-generated value |

Replace only conflicting apex/www parking records. Preserve mail, verification, and unrelated records. Use Porkbun's default TTL. Wait for Pages DNS validation and certificate issuance, then enable Enforce HTTPS and verify apex/www. A `.app` domain must be served over HTTPS for normal browser use.

Sources: [GitHub domain setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages), [Porkbun DNS editing](https://kb.porkbun.com/article/68-how-to-edit-dns-records).

## Feedback and follow-up

Share the beta guide with 3–5 developers. Collect a first-session report and a week-end summary. No automated outreach or monitoring is configured. Prioritize reproducible installation, data-loss, environment, and workflow failures. Keep unresolved performance and migration limits visible; no reference-machine certification is implied by release publication.

## In-app update assets

For a future updater-enabled release, add an `updates` array to the publication metadata. Copy the exact `updateAssets` entries from the private candidate, including `filename`, `sizeBytes` and `sha256`. Keep that same `updateAssets` array in the public verification JSON. Do not alter the currently published version or live metadata while preparing tooling changes.

Required entries are the ARM and Intel `Bristle-VERSION-mac-ARCH.zip` files plus `latest-mac.yml` and `beta-mac.yml`. Include both ZIP blockmaps when generated. Both manifests must be identical, contain both architectures' ZIP/DMG entries, and match the final files' sizes and SHA-512 hashes. The private build helper refreshes DMG hashes after notarization/stapling. Do not regenerate metadata during promotion or copy DMG blockmaps, which the Mac updater does not use.

Stage these files unchanged alongside the existing review documents and DMGs. Include every asset except the checksum manifest itself in `Bristle-VERSION-SHA256SUMS.txt`. The validators verify the complete asset list, manifest contents, public verification record, private-source release digests and uploaded bytes. An undeclared update payload, incomplete architecture pair, mismatched version or changed hash is rejected. Historical releases without updater metadata remain readable.

Tags can be `vVERSION-beta.N` (prerelease) or `vVERSION` (stable); the source/public release flags must agree. Increase the numeric application version whenever binaries change. Changing only a beta tag cannot update an installed app with the same app version. The first updater-enabled version still requires manual installation for existing users.

Focused tooling verification, with no website build, publication, or deployment:

```sh
npm ci --ignore-scripts
node --test tests/release.test.mjs tests/update-artifacts.test.mjs
```

The website workflow installs the locked dependency before its existing checks. Editing these tools does not run that workflow or publish an app. Actual signed upgrade verification remains a separate release task.
