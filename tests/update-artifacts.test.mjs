import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm, unlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parse, stringify } from 'yaml';
import { loadRelease, validateRelease, assetNames } from '../scripts/release.mjs';
import { inspectAssets, validateSourceRelease, sha256 } from '../scripts/promote-release.mjs';
import { inspectMacUpdateArtifacts } from '../scripts/update-artifacts.mjs';

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'bristle-public-updates-test-'));
  const release = structuredClone(await loadRelease());
  const files = [];
  for (const arch of ['arm64', 'x64']) {
    for (const ext of ['dmg', 'zip']) {
      const url = `Bristle-${release.version}-mac-${arch}.${ext}`, content = Buffer.from(`synthetic-${arch}-${ext}`);
      await writeFile(join(directory, url), content);
      files.push({ url, size: content.length, sha512: createHash('sha512').update(content).digest('base64') });
      if (ext === 'dmg') Object.assign(release.downloads.find(d => d.arch === arch), { sizeBytes: content.length, sha256: await sha256(join(directory, url)) });
    }
    await writeFile(join(directory, `Bristle-${release.version}-mac-${arch}.zip.blockmap`), `synthetic-${arch}-blockmap`);
  }
  const zip = files.find(file => file.url.endsWith('.zip'));
  const manifest = stringify({ version: release.version, files, path: zip.url, sha512: zip.sha512 });
  for (const name of ['latest-mac.yml', 'beta-mac.yml']) await writeFile(join(directory, name), manifest);
  release.updates = await inspectMacUpdateArtifacts(directory, release.version);
  for (const doc of release.documents) await writeFile(join(directory, doc.filename), 'synthetic-document');
  const verification = { version: release.version, sourceCommit: release.sourceCommit, artifacts: release.downloads, updateAssets: release.updates };
  await writeFile(join(directory, `Bristle-${release.version}-Verification.json`), JSON.stringify(verification));
  const checksum = `Bristle-${release.version}-SHA256SUMS.txt`;
  const lines = [];
  for (const name of (await readdir(directory)).filter(name => name !== checksum).sort()) lines.push(`${await sha256(join(directory, name))}  ${name}`);
  await writeFile(join(directory, checksum), lines.join('\n') + '\n');
  return { directory, release };
}

test('verifies the complete updater package and binds all new assets to private source provenance', async () => {
  const { directory, release } = await fixture();
  try {
    validateRelease(release);
    const assets = await inspectAssets(release, directory);
    assert.equal(assets.length, 12);
    assert.deepEqual(new Set(assets.map(a => a.name)), new Set(assetNames(release)));
    const source = { tag_name: release.tag, draft: false, prerelease: true, assets: assets.map(a => ({ ...a, state: 'uploaded', digest: 'sha256:' + a.sha256 })) };
    validateSourceRelease(release, source, { type: 'commit', sha: release.sourceCommit });
    const bad = structuredClone(source);
    bad.assets.find(a => a.name.endsWith('arm64.zip')).digest = 'sha256:' + '0'.repeat(64);
    assert.throws(() => validateSourceRelease(release, bad, { type: 'commit', sha: release.sourceCommit }), /differs/);
    const stable = { ...release, tag: `v${release.version}` };
    validateRelease(stable);
    validateSourceRelease(stable, { ...source, tag_name: stable.tag, prerelease: false }, { type: 'commit', sha: release.sourceCommit });
    assert.throws(() => validateSourceRelease(stable, { ...source, tag_name: stable.tag }, { type: 'commit', sha: release.sourceCommit }), /matching/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('rejects incomplete architecture assets, duplicated metadata and unsafe names', async () => {
  const { directory, release } = await fixture();
  try {
    for (const updates of [release.updates.slice(1), [...release.updates.slice(1), release.updates[1]], release.updates.map((a, i) => i ? a : { ...a, filename: '../private.zip' })]) {
      assert.throws(() => validateRelease({ ...release, updates }), /update assets/);
    }
    await unlink(join(directory, `Bristle-${release.version}-mac-x64.zip.blockmap`));
    await assert.rejects(inspectAssets(release, directory), /missing staged/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('checks manifest contents and artifact hashes, and refuses to silently drop updater assets', async () => {
  const { directory, release } = await fixture();
  try {
    const { updates: _updates, ...withoutUpdates } = release;
    await assert.rejects(inspectAssets(withoutUpdates, directory), /Unexpected/);
    const path = join(directory, 'latest-mac.yml'), info = parse(await readFile(path, 'utf8'));
    await writeFile(path, stringify({ ...info, version: '99.0.0' }));
    await assert.rejects(inspectMacUpdateArtifacts(directory, release.version), /Inconsistent/);
    await writeFile(path, stringify(info));
    await writeFile(join(directory, `Bristle-${release.version}-mac-arm64.zip`), 'tampered');
    await assert.rejects(inspectMacUpdateArtifacts(directory, release.version), /artifact bytes/);
    await assert.rejects(inspectAssets(release, directory), /identity mismatch/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
