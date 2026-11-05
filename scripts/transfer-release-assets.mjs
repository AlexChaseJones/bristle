import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRelease } from './release.mjs';
import { compareAssets, inspectAssets } from './promote-release.mjs';

export function validateTransferSources(release, tag, sources) {
  const expected = [...release.downloads, ...(release.updates ?? [])];
  if (tag !== release.tag || !release.updates?.length || !Array.isArray(sources) || sources.length !== expected.length || new Set(sources.map(a => a.filename)).size !== expected.length) throw new Error('Transfer must identify every installer and updater asset for this publication snapshot.');
  for (const source of sources) {
    if (!expected.some(a => a.filename === source.filename)) throw new Error('Unexpected transfer asset.');
    let url;
    try { url = new URL(source.url); } catch { throw new Error('Invalid asset download URL.'); }
    if (url.protocol !== 'https:' || url.hostname !== 'release-assets.githubusercontent.com' || url.port || url.username || url.password) throw new Error('Only GitHub release-asset download URLs are allowed.');
  }
  return expected;
}

async function main() {
  const release = await loadRelease();
  const sources = JSON.parse(process.env.RELEASE_ASSET_URLS ?? 'null');
  const expected = validateTransferSources(release, process.env.RELEASE_TAG, sources);
  const gh = args => {
    const result = spawnSync('gh', args, { encoding: 'utf8', env: { ...process.env, GH_PROMPT_DISABLED: '1' }, timeout: 300000 });
    if (result.error || result.status !== 0) throw new Error(result.stderr?.trim() || 'GitHub release command failed.');
    return result.stdout;
  };
  const current = () => {
    for (let page = 1; ; page++) {
      const releases = JSON.parse(gh(['api', `repos/${release.repository}/releases?per_page=100&page=${page}`]));
      const found = releases.find(a => a.tag_name === release.tag);
      if (found) return found;
      if (releases.length < 100) throw new Error('The public draft release does not exist.');
    }
  };
  const draft = current();
  if (!draft.draft || draft.target_commitish !== process.env.GITHUB_SHA) throw new Error('Transfer requires a draft targeting this exact publication commit.');
  const directory = resolve('.release', release.tag);
  await mkdir(directory, { recursive: true });
  // The four small review documents are uploaded locally. No private test logs
  // or source credentials are needed by this public repository's runner.
  gh(['release', 'download', release.tag, '--repo', release.repository, '--dir', directory, ...release.documents.flatMap(a => ['--pattern', a.filename])]);
  for (const source of sources) {
    const asset = expected.find(a => a.filename === source.filename);
    const response = await fetch(source.url, { redirect: 'error', signal: AbortSignal.timeout(180000) });
    if (!response.ok || !response.body || Number(response.headers.get('content-length')) !== asset.sizeBytes) throw new Error(`Download size or status mismatch: ${asset.filename}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(resolve(directory, asset.filename), { flags: 'wx' }));
    console.log(`Downloaded ${asset.filename}`);
  }
  const files = await inspectAssets(release, directory);
  const beforeUpload = current();
  if (!beforeUpload.draft || beforeUpload.id !== draft.id) throw new Error('Release changed during transfer.');
  compareAssets(beforeUpload.assets, files, { complete: false });
  const missing = files.filter(a => !beforeUpload.assets.some(b => b.name === a.name));
  if (missing.length) gh(['release', 'upload', release.tag, '--repo', release.repository, ...missing.map(a => a.path)]);
  const uploaded = current();
  if (!uploaded.draft) throw new Error('Release was published outside this transfer.');
  compareAssets(uploaded.assets, files);
  console.log(`Verified ${files.length} draft assets. Publication remains a separate provenance-checked action.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
