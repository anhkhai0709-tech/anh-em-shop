document.addEventListener('DOMContentLoaded',async()=>{
 const $=id=>document.getElementById(id), e=escapeHTML, money=n=>Number(n).toLocaleString('vi-VN')+'₫';
 try {const {user}=await cloudAPI('/auth/me');if(!user||user.role!=='admin'){location.href='index.html';return;}} catch(error){alert(error.message);return;}
 document.querySelectorAll('.admin-tab').forEach(tab=>tab.addEventListener('click',()=>{document.querySelectorAll('.admin-tab,.admin-panel').forEach(p=>p.classList.remove('active'));tab.classList.add('active');$('tab'+({products:'Products',orders:'Orders',system:'System'}[tab.dataset.tab])).classList.add('active');}));
 let editingId=null, products=[];
 const close=()=>{editingId=null;$('productModalOverlay').classList.remove('active');$('addProductForm').reset();$('adminProdImgPreview').style.display='none';};
 $('openAddProductModalBtn').onclick=()=>$('productModalOverlay').classList.add('active');
 $('closeProductModalBtn').onclick=close;$('cancelAddProductBtn').onclick=close;
 const compress=file=>new Promise((resolve,reject)=>{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5000000){reject(Error('Chọn ảnh JPEG/PNG/WebP dưới 5 MB'));return;}
  const url=URL.createObjectURL(file), img=new Image();img.onload=()=>{const c=document.createElement('canvas'),r=Math.min(1,600/img.width,600/img.height);c.width=Math.round(img.width*r);c.height=Math.round(img.height*r);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);const result=c.toDataURL('image/jpeg',0.65);if(result.length>200000)reject(Error('Ảnh quá lớn; chọn ảnh nhỏ hơn'));else resolve(result);};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Không đọc được ảnh'));};img.src=url;
 });
 $('adminProdImageFile').onchange=async()=>{try{if(!$('adminProdImageFile').files[0])return;$('adminProdImgPreview').src=await compress($('adminProdImageFile').files[0]);$('adminProdImgPreview').style.display='block';}catch(error){alert(error.message);}};
 $('adminProdImageUrl').oninput=()=>{const url=$('adminProdImageUrl').value.trim();if(/^(https:\/\/|assets\/images\/)/.test(url)){$('adminProdImgPreview').src=url;$('adminProdImgPreview').style.display='block';}};
 $('addProductForm').onsubmit=async event=>{
  event.preventDefault();const button=event.submitter;if(button.disabled)return;button.disabled=true;
  try{const file=$('adminProdImageFile').files[0];const image_url=file?await compress(file):$('adminProdImageUrl').value.trim()||'assets/images/anhaolv.jpg';
   await cloudAPI('/products'+(editingId?'/'+editingId:''),{method:editingId?'PUT':'POST',body:JSON.stringify({name:$('adminProdName').value,category:$('adminProdCategory').value,price:Number($('adminProdPrice').value),description:$('adminProdDesc').value,badge:$('adminProdBadge').value,image_url})});close();await load();alert('Đã lưu sản phẩm lên đám mây');
  }catch(error){alert(error.message);}finally{button.disabled=false;}
 };
 $('adminLogoutBtn').onclick=async()=>{try{await cloudAPI('/auth/logout',{method:'POST'});localStorage.removeItem('anhem_user');location.href='index.html';}catch(error){alert(error.message);}};
 $('adminProductsTbody').onclick=async event=>{const edit=event.target.closest('[data-edit]');if(edit){const p=products.find(p=>p.id===Number(edit.dataset.edit));editingId=p.id;$('adminProdName').value=p.name;$('adminProdCategory').value=p.category;$('adminProdPrice').value=p.price;$('adminProdDesc').value=p.description||'';$('adminProdBadge').value=p.badge||'';$('adminProdImageUrl').value=p.image_url;$('productModalOverlay').classList.add('active');return;}const b=event.target.closest('[data-delete]');if(!b||!confirm('Xóa sản phẩm này?'))return;try{await cloudAPI('/products/'+b.dataset.delete,{method:'DELETE'});await load();}catch(error){alert(error.message);}};
 $('adminOrdersTbody').onclick=async event=>{const b=event.target.closest('[data-order]');if(!b)return;b.disabled=true;try{await cloudAPI('/orders',{method:'PUT',body:JSON.stringify({order_id:b.dataset.order,status:b.dataset.status})});await load();}catch(error){alert(error.message);}finally{b.disabled=false;}};
 async function load(){
  try{const [p,o]=await Promise.all([cloudAPI('/products'),cloudAPI('/orders')]);products=p.products;$('prodCount').textContent=p.products.length;$('orderCount').textContent=o.orders.length;
   $('adminProductsTbody').innerHTML=p.products.map(p=>`<tr><td><img src="${e(p.image_url)}" alt="${e(p.name)}" style="width:48px;height:48px;object-fit:cover"></td><td>${e(p.name)}</td><td>${e(p.category)}</td><td>${money(p.price)}</td><td>${e(p.badge)}</td><td><button class="btn btn--sm btn--outline" data-edit="${p.id}">Sửa</button> <button class="btn btn--sm btn--outline" data-delete="${p.id}">Xóa</button></td></tr>`).join('')||'<tr><td colspan="6">Chưa có sản phẩm</td></tr>';
   $('adminOrdersTbody').innerHTML=o.orders.map(o=>`<tr><td title="${e(o.id)}">#${e(o.id.slice(0,8))}</td><td>${e(o.customer_name)}</td><td>${e(o.phone)}</td><td>${e(o.email)}<br>${e(o.address)}<br>${e(o.notes)}<br>${o.items.map(i=>e(i.product_name)+' × '+i.quantity).join('<br>')}</td><td>${money(o.total)}</td><td>${e(o.status)}</td><td>${e(o.date)}</td><td>${['Đã duyệt','Đang giao','Đã giao','Đã hủy'].map(status=>`<button class="btn btn--sm btn--outline" data-order="${e(o.id)}" data-status="${status}">${status}</button>`).join(' ')}</td></tr>`).join('')||'<tr><td colspan="8">Chưa có đơn hàng</td></tr>';
   $('cloudStatus').textContent='Đã kết nối cơ sở dữ liệu Cloudflare D1. Sản phẩm và đơn hàng đã tải từ máy chủ.';
  }catch(error){$('cloudStatus').textContent=error.message;alert(error.message);}
 }
 await load();
});
