import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTransferSources } from '../scripts/transfer-release-assets.mjs';

const release = { tag: 'v0.2.2-beta.1', downloads: [{ filename: 'arm64.dmg' }, { filename: 'x64.dmg' }], updates: [{ filename: 'beta-mac.yml' }] };
const sources = [...release.downloads, ...release.updates].map(a => ({ filename: a.filename, url: 'https://release-assets.githubusercontent.com/example?temporary=access' }));
test('transfer binds every source to the selected release and permits only GitHub asset hosts', () => {
  assert.equal(validateTransferSources(release, release.tag, sources).length, 3);
  for (const invalid of [sources.slice(1), [sources[0], sources[0], sources[2]], [...sources.slice(0, 2), { ...sources[2], filename: '../private.txt' }]]) assert.throws(() => validateTransferSources(release, release.tag, invalid));
  assert.throws(() => validateTransferSources(release, 'v0.2.1-beta.1', sources));
  for (const url of ['http://release-assets.githubusercontent.com/example', 'https://github.com/private', 'https://release-assets.githubusercontent.com.evil.test/example', 'https://token@release-assets.githubusercontent.com/example', 'https://127.0.0.1/example', 'not-a-url']) assert.throws(() => validateTransferSources(release, release.tag, [{ ...sources[0], url }, ...sources.slice(1)]));
});
