import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {onRequest} from './functions/api/[[path]].js';
fs.mkdirSync('.local',{recursive:true});const db=new DatabaseSync('.local/shop.sqlite');
if(!db.prepare("SELECT name FROM sqlite_master WHERE name='users'").get())db.exec(fs.readFileSync('migrations/0001_init.sql','utf8'));
const wrap=(sql,params=[])=>({bind(...p){return wrap(sql,p)},async first(){return db.prepare(sql).get(...params)||null},async all(){return {results:db.prepare(sql).all(...params)}},async run(){const r=db.prepare(sql).run(...params);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}});
const DB={prepare:wrap,async batch(list){db.exec('BEGIN');try{const r=await Promise.all(list.map(s=>s.run()));db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://127.0.0.1:8789');if(url.pathname.startsWith('/api/')){let body='';for await(const chunk of req){body+=chunk;if(body.length>250000){res.writeHead(413);res.end();return}}const r=await onRequest({request:new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}: {})}),env:{DB}});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()));return}
 const rel=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);const base=path.resolve('public');const file=path.resolve(base,'.'+rel);if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
}catch(e){console.error(e);res.writeHead(500);res.end('Local server error')}}).listen(8789,'127.0.0.1',()=>console.log('Anh Em Shop: http://127.0.0.1:8789 — local DB only, AI fallback'));
