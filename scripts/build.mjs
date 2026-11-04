import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRelease, releaseUrl, assetUrl } from './release.mjs';
import { pages } from '../site/pages.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = resolve(root, 'dist');
const r = await loadRelease();
const escape = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const e = escape;
const download = (d, primary = false) => `<a class="button ${primary ? 'primary' : 'secondary'}" href="${assetUrl(r,d.filename)}"><span>Download for ${e(d.label)}</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg></a>`;
const downloads = () => `<div class="download-buttons">${r.downloads.map((d,i) => download(d,i===0)).join('')}</div><p class="download-note">macOS · ${e(r.label)} · Free during beta</p>`;
const documents = () => `<ul class="resource-list">${r.documents.map(d=>`<li><a href="${assetUrl(r,d.filename)}">${e(d.label)} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>`;
const nav = [['/getting-started/','Get started'],['/releases/','Releases'],['/support/','Support']];

if (dirname(out) !== resolve(root) || out !== resolve(root, 'dist')) throw new Error('Unsafe build output path');
await rm(out, {recursive:true, force:true});
await mkdir(out,{recursive:true});
await cp(resolve(root,'site/assets'),resolve(out,'assets'),{recursive:true});
await cp(resolve(root,'site/style.css'),resolve(out,'style.css'));
await writeFile(resolve(out,'.nojekyll'),'');
await writeFile(resolve(out,'release.json'),JSON.stringify({...r, releaseUrl:releaseUrl(r),downloads:r.downloads.map(d=>({...d,url:assetUrl(r,d.filename)}))},null,2)+'\n');
const builtPages=pages({r,e,downloads,documents,assetUrl,releaseUrl});
for(const page of builtPages){
  const canonical=r.siteUrl+page.path;
  const html=`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(page.title)} · Bristle</title><meta name="description" content="${e(page.description)}"><link rel="canonical" href="${canonical}"><meta name="theme-color" content="#f6f5f2"><link rel="icon" type="image/svg+xml" href="/assets/icon.svg"><link rel="stylesheet" href="/style.css"><meta property="og:type" content="website"><meta property="og:site_name" content="Bristle"><meta property="og:title" content="${e(page.title)}"><meta property="og:description" content="${e(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${r.siteUrl}/assets/social-preview.png"><meta property="og:image:alt" content="Bristle: Your API work, in focus."><meta name="twitter:card" content="summary_large_image">${page.path==='/404.html'?'<meta name="robots" content="noindex">':''}</head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="header-inner"><a class="brand" href="/" aria-label="Bristle home"><img src="/assets/icon.svg" alt="" width="36" height="36"><span>Bristle</span></a><nav aria-label="Main navigation">${nav.map(([path,label])=>`<a href="${path}"${page.path===path?' aria-current="page"':''}>${label}</a>`).join('')}<a class="nav-download" href="/#download">Get the beta <span aria-hidden="true">↗</span></a></nav></div></header>
<main id="main" tabindex="-1">${page.body}</main>
<footer class="site-footer"><div class="footer-top"><a class="brand" href="/" aria-label="Bristle home"><img src="/assets/icon.svg" alt="" width="32" height="32"><span>Bristle</span></a><p>A little less clutter. A lot more clarity.</p><a href="https://github.com/${r.repository}">Bristle on GitHub <span aria-hidden="true">↗</span></a></div><div class="footer-bottom"><span>Independently made by Alexander Jones.</span><nav aria-label="Footer navigation"><a href="/privacy/">Privacy</a><a href="/support/#security">Security &amp; IT</a><a href="/beta-guide/">Beta guide</a><a href="/license/">License</a></nav></div></footer></body></html>\n`;
  const path=resolve(out,page.path==='/'?'index.html':page.path.endsWith('/')?page.path.slice(1)+'index.html':page.path.slice(1));
  await mkdir(dirname(path),{recursive:true}); await writeFile(path,html);
}
await writeFile(resolve(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${r.siteUrl}/sitemap.xml\n`);
await writeFile(resolve(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${builtPages.filter(p=>p.path!=='/404.html').map(p=>`<url><loc>${r.siteUrl}${p.path}</loc></url>`).join('')}</urlset>\n`);
console.log(`Built ${builtPages.length} pages for ${r.siteUrl}; release ${r.tag}.`);
