import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const root=resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.txt':'text/plain; charset=utf-8','.xml':'application/xml'};
const port=Number(process.env.PORT||4173);
createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    let target=resolve(root,'.'+decodeURIComponent(url.pathname));
    if(target!==root&&!target.startsWith(root+sep)){res.writeHead(403).end();return;}
    try{if((await stat(target)).isDirectory())target=resolve(target,'index.html');}catch{target=resolve(root,'404.html');res.statusCode=404;}
    res.setHeader('Content-Type',types[extname(target)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');res.end(await readFile(target));
  }catch{res.writeHead(500).end('Preview error');}
}).listen(port,'127.0.0.1',()=>console.log(`Bristle preview: http://127.0.0.1:${port}`));
