(()=>{
 const allowed=localStorage.getItem('anhem_analytics')!=='off';
 window.trackShop=(event)=>{if(!allowed)return;fetch('/api/analytics/event',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,path:location.pathname,referrer:document.referrer}),keepalive:true}).catch(()=>{});};
 trackShop('page_view');if(location.pathname.includes('product.html'))trackShop('product_view');
 document.addEventListener('click',e=>{if(e.target.closest('.add-to-cart-btn,#detailAdd'))trackShop('add_cart');if(e.target.closest('#checkoutBtn,.buy-now-btn'))trackShop('checkout');});
 let timer;document.getElementById('searchInput')?.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(()=>trackShop('search'),1000)});
 const note=document.createElement('div');note.style='padding:12px;text-align:center;background:#f0fdfa;font:12px Inter,sans-serif;color:#134e4a';note.innerHTML='Anh Em Shop lưu hành vi truy cập, nguồn giới thiệu, thiết bị và IP trong 30 ngày để thống kê. Vị trí chỉ gần đúng theo mạng. <button type="button" id="analyticsOptOut">'+(allowed?'Tắt thống kê trên trình duyệt này':'Bật thống kê')+'</button>';document.body.append(note);document.getElementById('analyticsOptOut').onclick=()=>{localStorage.setItem('anhem_analytics',allowed?'off':'on');location.reload()};
})();