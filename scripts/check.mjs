import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRelease, assetUrl } from './release.mjs';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const release=await loadRelease();
const files=await readdir(root,{recursive:true});
const errors=[];
let links=0;
for(const file of files.filter(f=>f.endsWith('.html'))){
  const html=await readFile(resolve(root,file),'utf8');
  if((html.match(/<h1\b/g)||[]).length!==1) errors.push(`${file}: expected one h1`);
  if(!html.includes('<html lang="en">')||!html.includes('name="viewport"')) errors.push(`${file}: missing document metadata`);
  if(/<script\b|<iframe\b|on(?:click|load)=/i.test(html)) errors.push(`${file}: unexpected runtime code or embed`);
  if(/(?:href|src)="[^"\n]*request-grove/.test(html)) errors.push(`${file}: private source repository link in visitor navigation`);
  for(const [,kind,value] of html.matchAll(/\b(href|src)="([^"<>]+)"/g)){
    links++;
    if(value.startsWith('mailto:')) continue;
    const url=new URL(value,release.siteUrl+'/'+file.replaceAll('\\','/'));
    if(url.protocol!=='https:') {errors.push(`${file}: unexpected URL protocol ${value}`);continue;}
    if(url.origin!==release.siteUrl) continue;
    const relative=decodeURIComponent(url.pathname.slice(1));
    const target=resolve(root,relative.endsWith('/')||!relative?relative+'index.html':relative);
    if(!target.startsWith(root)) {errors.push(`${file}: outside output ${value}`);continue;}
    try{
      await stat(target);
      if(url.hash && extname(target)==='.html'){
        const linked=await readFile(target,'utf8');
        if(!linked.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`))errors.push(`${file}: missing fragment ${value}`);
      }
    } catch{errors.push(`${file}: missing ${kind} ${value}`);}
  }
  for(const tag of html.matchAll(/<img\b[^>]*>/g))if(!/\balt="/.test(tag[0])||!/\bwidth="/.test(tag[0])||!/\bheight="/.test(tag[0]))errors.push(`${file}: image lacks alt or dimensions`);
}
const homepage=await readFile(resolve(root,'index.html'),'utf8');
for(const d of release.downloads)if(!homepage.includes(assetUrl(release,d.filename)))errors.push(`Homepage lacks ${d.arch} download`);
for(const filename of ['robots.txt','sitemap.xml','404.html','release.json','assets/social-preview.png'])await stat(resolve(root,filename)).catch(()=>errors.push(`Missing ${filename}`));
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Checked ${files.filter(f=>f.endsWith('.html')).length} pages and ${links} links; no scripts, embeds, private navigation links, or missing assets.`);
