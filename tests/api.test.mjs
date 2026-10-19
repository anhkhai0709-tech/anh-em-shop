import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {onRequest,hash} from '../functions/api/[[path]].js';
import {answerChat} from '../server/ai-chat.js';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../migrations/0001_init.sql',import.meta.url),'utf8'));
sqlite.exec(readFileSync(new URL('../migrations/0002_analytics.sql',import.meta.url),'utf8'));
const wrap=(sql,params=[])=>({bind(...p){return wrap(sql,p)},async first(){return sqlite.prepare(sql).get(...params)||null},async all(){return {results:sqlite.prepare(sql).all(...params)}},async run(){const r=sqlite.prepare(sql).run(...params);return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}}});
const DB={prepare:wrap,async batch(list){sqlite.exec('BEGIN');try{const r=await Promise.all(list.map(s=>s.run()));sqlite.exec('COMMIT');return r}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const env={DB};
async function call(path,method='GET',body,cookie){const r=await onRequest({request:new Request('https://anhem.test/api'+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}),env});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
test('registration, isolation, server prices, permissions, admin CRUD, order approval, logout',async()=>{
 const password=crypto.randomUUID();
 assert.equal((await call('/auth/register','POST',{username:'buyer1',email:'buyer1@example.test',password})).status,201);
 assert.equal((await call('/auth/register','POST',{username:'buyer2',email:'buyer2@example.test',password})).status,201);
 assert.equal((await call('/auth/register','POST',{username:'buyer1',email:'buyer1@example.test',password})).status,409);
 assert.equal((await call('/auth/login','POST',{username:'buyer1',password:'wrong'})).status,401);
 const user=await call('/auth/login','POST',{username:'buyer1',password});assert.ok(user.cookie.startsWith('anhem_session='));
 const other=await call('/auth/login','POST',{username:'buyer2',password});
 assert.equal((await call('/orders')).status,401);
 assert.equal((await call('/products','POST',{name:'bad'},user.cookie)).status,403);
 const p=(await call('/products')).data.products[0];
 const body={customer_name:'Local Test',customer_phone:'0000000000',shipping_address:'Test only',items:[{id:p.id,quantity:2,price:1}],total_amount:1};
 assert.equal((await call('/orders','POST',{...body,items:[{id:p.id,quantity:-1}]},user.cookie)).status,400);
 const order=await call('/orders','POST',body,user.cookie);assert.equal(order.status,201);assert.equal(order.data.total_amount,p.price*2);
 assert.equal((await call('/orders/mine','GET',null,other.cookie)).data.orders.length,0);
 assert.equal((await call('/orders/mine','GET',null,user.cookie)).data.orders[0].status,'Chờ duyệt');
 sqlite.prepare('INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,?)').run('testadmin','admin@example.test',await hash(password),'admin');
 const admin=await call('/auth/login','POST',{username:'testadmin',password});
 assert.equal((await call('/orders','PUT',{order_id:order.data.order_id,status:'Đã duyệt'},admin.cookie)).status,200);
 assert.equal((await call('/orders/mine','GET',null,user.cookie)).data.orders[0].status,'Đã duyệt');
 const product={name:'Test shirt',category:'nam',price:50000,image_url:'assets/images/anhaolv.jpg'};
 const created=await call('/products','POST',product,admin.cookie);assert.equal(created.status,201);const id=created.data.product.id;
 assert.equal((await call('/products/'+id,'PUT',{...product,name:'Edited'},admin.cookie)).status,200);
 assert.equal((await call('/products/'+id)).data.product.name,'Edited');
 assert.equal((await call('/products/'+id,'DELETE',null,admin.cookie)).status,200);
 assert.equal((await call('/products/'+id)).status,404);
 await call('/auth/logout','POST',{},user.cookie);assert.equal((await call('/auth/me','GET',null,user.cookie)).data.user,null);
});
test('chat uses own catalog and AI failure falls back safely',async()=>{
 const lookup=await answerChat(env,'Áo phông LV giá bao nhiêu?',null,'test');assert.ok(lookup.products.some(p=>p.id===5));
 const fallback=await answerChat({...env,AI:{run(){throw Error('test')}}},'tư vấn phối đồ đi học',null,'test');assert.equal(fallback.source,'shop');
});

test('analytics captures trusted network metadata and protects raw IP from public users',async()=>{
 const req=new Request('https://anhem.test/api/analytics/event',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':'192.0.2.10','User-Agent':'Mozilla/5.0 (Windows NT 10.0) Chrome/125'},body:JSON.stringify({event:'page_view',path:'/index.html?secret=ignored',referrer:'https://example.test/path?private=ignored'})});
 Object.defineProperty(req,'cf',{value:{country:'VN',city:'Test city'}});
 assert.equal((await onRequest({request:req,env})).status,201);
 const row=sqlite.prepare('SELECT * FROM analytics_events ORDER BY id DESC').get();assert.equal(row.ip,'192.0.2.10');assert.equal(row.country,'VN');assert.equal(row.device,'Desktop');assert.equal(row.referrer,'example.test');assert.equal(row.path,'/index.html');
 assert.equal((await call('/analytics')).status,401);
 assert.equal((await call('/analytics/event','POST',{event:'password',path:'/'})).status,400);
});
