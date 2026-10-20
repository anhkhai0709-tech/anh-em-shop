import { basinRecord, sendBasin } from '../../server/basin.js';
import { answerChat } from '../../server/ai-chat.js';
const enc=new TextEncoder(), hex=b=>Array.from(new Uint8Array(b),v=>v.toString(16).padStart(2,'0')).join('');
export async function hash(password,salt=hex(crypto.getRandomValues(new Uint8Array(16)))) { const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']); return 'pbkdf2$'+salt+'$'+hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:enc.encode(salt),iterations:100000,hash:'SHA-256'},key,256)); }
const digest=async v=>hex(await crypto.subtle.digest('SHA-256',enc.encode(v)));
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const text=(v,max=500)=>typeof v==='string'?v.trim().slice(0,max):'';
const json=(data,status=200,headers={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
export async function onRequest({request,env}) {
 try {
  if (!env.DB) fail(503,'Chưa kết nối Cloudflare D1');
  const path=new URL(request.url).pathname.replace(/^\/api/,''), method=request.method;
  if (!['GET','HEAD'].includes(method)&&request.headers.get('Origin')&&request.headers.get('Origin')!==new URL(request.url).origin) fail(403,'Nguồn yêu cầu không hợp lệ');
  const token=request.headers.get('Cookie')?.match(/(?:^|;\s*)anhem_session=([a-f0-9]{64})/)?.[1];
  const user=token?await env.DB.prepare('SELECT u.id,u.username,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await digest(token),Date.now()).first():null;
  const auth=()=>{if(!user)fail(401,'Vui lòng đăng nhập lại');};
  const admin=()=>{auth();if(user.role!=='admin')fail(403,'Cần quyền quản trị');};
  if(path==='/analytics/event'&&method==='POST'){
   const b=await request.json();if(!['page_view','product_view','search','add_cart','checkout','order_success'].includes(b.event))fail(400,'Sự kiện không hợp lệ');
   const path=text(b.path,180).split('?')[0];if(!/^\/[a-zA-Z0-9_./-]*$/.test(path))fail(400,'Trang không hợp lệ');
   const ua=request.headers.get('User-Agent')||'',device=/iPad|Tablet/i.test(ua)?'Tablet':/Mobile|Android|iPhone/i.test(ua)?'Mobile':'Desktop',browser=/Edg/i.test(ua)?'Edge':/Firefox/i.test(ua)?'Firefox':/Chrome/i.test(ua)?'Chrome':/Safari/i.test(ua)?'Safari':'Other',os=/Windows/i.test(ua)?'Windows':/Android/i.test(ua)?'Android':/iPhone|iPad/i.test(ua)?'iOS':/Mac OS/i.test(ua)?'macOS':/Linux/i.test(ua)?'Linux':'Other';
   let referrer='Direct';try{referrer=new URL(b.referrer).hostname.slice(0,150)}catch{}
   await env.DB.batch([env.DB.prepare('INSERT INTO analytics_events(event,path,referrer,device,browser,os,ip,country,city,user_id) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(b.event,path,referrer,device,browser,os,text(request.headers.get('CF-Connecting-IP'),60)||'Local',text(request.cf?.country,10),text(request.cf?.city,100),user?.id||null),env.DB.prepare("DELETE FROM analytics_events WHERE created_at < datetime('now','-30 days')")]);
   const stream=b.event==='page_view'?await sendBasin(env,basinRecord(request,env.BASIN_GROUP_ID||'07',path,device,os,browser,referrer)):{status:'not_page_view'};
   return json({ok:true,stream},201);
  }
  if(path==='/analytics'&&method==='GET'){
   admin();const total=await env.DB.prepare("SELECT COUNT(*) events,COUNT(DISTINCT ip) visitors,SUM(CASE WHEN event='page_view' THEN 1 ELSE 0 END) page_views FROM analytics_events WHERE created_at>=datetime('now','-30 days')").first();
   const rows=(await env.DB.prepare("SELECT * FROM analytics_events WHERE created_at>=datetime('now','-30 days') ORDER BY id DESC LIMIT 200").all()).results;
   const grouped=async field=>(await env.DB.prepare('SELECT '+field+" label,COUNT(*) count FROM analytics_events WHERE created_at>=datetime('now','-30 days') GROUP BY "+field+' ORDER BY count DESC LIMIT 12').all()).results;
   const last24=await env.DB.prepare("SELECT COUNT(*) page_views FROM analytics_events WHERE event='page_view' AND created_at>=datetime('now','-24 hours')").first();
   return json({total,last24,basin:{enabled:Boolean(env.BASIN_INGEST_URL),group:env.BASIN_GROUP_ID||'07',query_available:false},rows,devices:await grouped('device'),sources:await grouped('referrer'),actions:await grouped('event'),countries:await grouped('country')});
  }
  if(path==='/chat'&&method==='POST'){
   const body=await request.json();
   if(typeof body.message!=='string'||!body.message.trim()||body.message.length>500)fail(400,'Nhập câu hỏi từ 1 đến 500 ký tự');
   const clientKey=await digest(request.headers.get('CF-Connecting-IP')||'local-demo');
   return json(await answerChat(env,body.message.trim(),body.contextId,clientKey,body.history));
  }
  if(path==='/auth/me'&&method==='GET')return json({user});
  if(path==='/auth/logout'&&method==='POST'){if(token)await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(token)).run();return json({message:'Đã đăng xuất'},200,{'Set-Cookie':'anhem_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'});}
  if(path==='/auth/register'&&method==='POST'){
   const b=await request.json(),u=text(b.username,40),e=text(b.email,120).toLowerCase();
   if(!/^[\p{L}\p{N}_.-]{3,40}$/u.test(u)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)||typeof b.password!=='string'||b.password.length<8||b.password.length>128)fail(400,'Tên tài khoản từ 3 ký tự, email hợp lệ, mật khẩu từ 8 đến 128 ký tự');
   if(['admin','anhemshop'].includes(u.toLowerCase()))fail(400,'Tên tài khoản dành cho quản trị');
   if(await env.DB.prepare('SELECT id FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE').bind(u,e).first())fail(409,'Tài khoản hoặc email đã tồn tại');
   await env.DB.prepare('INSERT INTO users(username,email,password_hash,role) VALUES(?,?,?,?)').bind(u,e,await hash(b.password),'user').run();return json({message:'Đăng ký thành công'},201);
  }
  if(path==='/auth/login'&&method==='POST'){
   const b=await request.json(),r=await env.DB.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE OR email=? COLLATE NOCASE').bind(text(b.username,120),text(b.username,120)).first();
   if(!r||typeof b.password!=='string'||b.password.length>128||!r.password_hash.startsWith('pbkdf2$')||await hash(b.password,r.password_hash.split('$')[1])!==r.password_hash)fail(401,'Tên đăng nhập hoặc mật khẩu không đúng');
   const t=hex(crypto.getRandomValues(new Uint8Array(32)));
   await env.DB.batch([env.DB.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now()),env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(t),r.id,Date.now()+86400000)]);
   return json({user:{id:r.id,username:r.username,email:r.email,role:r.role}},200,{'Set-Cookie':`anhem_session=${t}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`});
  }
  if(path==='/products'&&method==='GET')return json({products:(await env.DB.prepare('SELECT * FROM products ORDER BY id DESC').all()).results});
  if(/^\/products\/\d+$/.test(path)&&method==='GET'){
   const product=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(Number(path.split('/')[2])).first();
   if(!product)fail(404,'Sản phẩm không còn tồn tại');
   return json({product});
  }
  if((path==='/products'&&method==='POST')||(/^\/products\/\d+$/.test(path)&&method==='PUT')){
   admin();const b=await request.json(),p=Number(b.price),img=text(b.image_url,200000);
   if(!text(b.name,120)||!Number.isSafeInteger(p)||p<=0||p>100000000||!['nam','nu','phukien'].includes(b.category))fail(400,'Tên, danh mục hoặc giá không hợp lệ');
   if(!/^(assets\/images\/[\w.-]+|https:\/\/[^\s"'<>]+|data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+)$/.test(img))fail(400,'Ảnh phải là assets, HTTPS hoặc JPEG/PNG/WebP');
   if(method==='PUT'){const r=await env.DB.prepare('UPDATE products SET name=?,category=?,price=?,description=?,image_url=?,badge=? WHERE id=?').bind(text(b.name,120),b.category,p,text(b.description,2000),img,text(b.badge,30),Number(path.split('/')[2])).run();if(!r.meta.changes)fail(404,'Không tìm thấy sản phẩm');return json({message:'Đã sửa sản phẩm'});}
   const r=await env.DB.prepare('INSERT INTO products(name,category,price,description,image_url,badge) VALUES(?,?,?,?,?,?)').bind(text(b.name,120),b.category,p,text(b.description,2000),img,text(b.badge,30)).run();return json({product:{id:r.meta.last_row_id}},201);
  }
  if(/^\/products\/\d+$/.test(path)&&method==='DELETE'){admin();await env.DB.prepare('DELETE FROM products WHERE id=?').bind(Number(path.split('/')[2])).run();return json({message:'Đã xóa'});}
  if(path==='/orders'&&method==='POST'){
   auth();const b=await request.json();if(!text(b.customer_name,120)||!text(b.customer_phone,30)||!text(b.shipping_address||b.address,500)||!Array.isArray(b.items)||!b.items.length||b.items.length>50)fail(400,'Điền thông tin nhận hàng và thêm sản phẩm vào giỏ');
   const quantities=new Map();for(const i of b.items){const id=Number(i.id),q=Number(i.quantity);if(!Number.isSafeInteger(id)||id<1||!Number.isSafeInteger(q)||q<1||q>99)fail(400,'Sản phẩm hoặc số lượng không hợp lệ');quantities.set(id,(quantities.get(id)||0)+q);}
   const items=[];let total=0;for(const [id,q]of quantities){const p=await env.DB.prepare('SELECT * FROM products WHERE id=?').bind(id).first();if(!p||q>99)fail(400,'Sản phẩm không còn tồn tại hoặc số lượng quá lớn; cập nhật lại giỏ hàng');items.push({...p,quantity:q});total+=p.price*q;}
   const id=crypto.randomUUID(),statements=[env.DB.prepare('INSERT INTO orders(id,user_id,customer_name,customer_email,customer_phone,shipping_address,notes,total_amount,status) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,user.id,text(b.customer_name,120),text(b.customer_email,120),text(b.customer_phone,30),text(b.shipping_address||b.address,500),text(b.notes,2000),total,'Chờ duyệt')];
   for(const p of items)statements.push(env.DB.prepare('INSERT INTO order_items(order_id,product_id,product_name,price,quantity) VALUES(?,?,?,?,?)').bind(id,p.id,p.name,p.price,p.quantity));await env.DB.batch(statements);return json({order_id:id,total_amount:total},201);
  }
  if(path==='/orders/mine'&&method==='GET'){
   auth();
   const orders=(await env.DB.prepare('SELECT id,customer_name,shipping_address,total_amount,status,created_at FROM orders WHERE user_id=? ORDER BY created_at DESC,id DESC').bind(user.id).all()).results;
   const items=(await env.DB.prepare('SELECT i.order_id,i.product_name,i.price,i.quantity FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.user_id=? ORDER BY i.id').bind(user.id).all()).results;
   return json({orders:orders.map(o=>({...o,items:items.filter(i=>i.order_id===o.id)}))});
  }
  if(path==='/orders'&&method==='GET'){admin();const orders=(await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()).results,items=(await env.DB.prepare('SELECT * FROM order_items').all()).results;return json({orders:orders.map(o=>({...o,items:items.filter(i=>i.order_id===o.id),phone:o.customer_phone,email:o.customer_email,address:o.shipping_address,total:o.total_amount,date:o.created_at}))});}
  if(path==='/orders'&&method==='PUT'){admin();const b=await request.json();if(!['Chờ duyệt','Đã duyệt','Đang giao','Đã giao','Đã hủy'].includes(b.status))fail(400,'Trạng thái không hợp lệ');const r=await env.DB.prepare('UPDATE orders SET status=? WHERE id=?').bind(b.status,text(b.order_id,50)).run();if(!r.meta.changes)fail(404,'Không tìm thấy đơn');return json({message:'Đã cập nhật'});}
  fail(404,'Không tìm thấy API');
 }catch(e){if(!e.status)console.error(e);return json({error:e.status?e.message:'Không thể lưu dữ liệu; vui lòng thử lại'},e.status||500);}
}
