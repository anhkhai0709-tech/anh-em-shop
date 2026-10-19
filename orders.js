(() => {
  const list=document.getElementById('myOrders'), message=document.getElementById('ordersMessage'), button=document.getElementById('refreshOrders');
  const money=value=>Number(value).toLocaleString('vi-VN')+'₫';
  const statuses={
    'Chờ duyệt':{class:'pending',description:'Cửa hàng chưa duyệt đơn của bạn.'},
    'Đã duyệt':{class:'approved',description:'Cửa hàng đã xác nhận đơn của bạn.'},
    'Đang giao':{class:'shipping',description:'Đơn hàng đang được giao đến bạn.'},
    'Đã giao':{class:'approved',description:'Đơn hàng đã hoàn thành giao hàng.'},
    'Đã hủy':{class:'cancelled',description:'Đơn hàng đã được hủy.'}
  };
  function date(value){const parsed=new Date(value.replace(' ','T')+'Z');return Number.isNaN(parsed.getTime())?value:parsed.toLocaleString('vi-VN');}
  async function load(){
    button.disabled=true;list.setAttribute('aria-busy','true');message.textContent='Đang tải đơn hàng…';
    try {
      const {user}=await cloudAPI('/auth/me');
      if(!user){list.innerHTML='<div class="orders-message">Vui lòng <a href="index.html" style="color:var(--primary)">về cửa hàng và đăng nhập</a> để xem đơn hàng của bạn.</div>';message.textContent='Bạn chưa đăng nhập.';return;}
      const {orders}=await cloudAPI('/orders/mine');
      list.innerHTML=orders.map(order=>{
        const state=statuses[order.status]||{class:'pending',description:'Đang cập nhật trạng thái.'};
        return `<article class="order-card"><div class="order-top"><h2 style="font-size:1.1rem" title="${escapeHTML(order.id)}">Đơn #${escapeHTML(order.id.slice(0,8))}</h2><span class="order-status ${state.class}">${escapeHTML(order.status)}</span></div><p>${state.description}</p><p class="order-meta">Ngày đặt: ${escapeHTML(date(order.created_at))}</p><p class="order-meta">Người nhận: ${escapeHTML(order.customer_name)} · ${escapeHTML(order.shipping_address)}</p><div>${order.items.map(item=>`<div class="order-item"><span>${escapeHTML(item.product_name)} × ${item.quantity}</span><strong>${money(item.price*item.quantity)}</strong></div>`).join('')}</div><p class="order-total">Tổng tiền: ${money(order.total_amount)}</p></article>`;
      }).join('')||'<div class="orders-message">Bạn chưa có đơn hàng. <a href="index.html" style="color:var(--primary)">Chọn sản phẩm để đặt hàng →</a></div>';
      message.textContent=orders.length?`${orders.length} đơn hàng · Cập nhật lúc ${new Date().toLocaleTimeString('vi-VN')}`:'Chưa có đơn hàng.';
    }catch(error){list.innerHTML='';message.textContent=error.message+' — nhấn Cập nhật trạng thái để thử lại.';}
    finally{button.disabled=false;list.setAttribute('aria-busy','false');}
  }
  button.addEventListener('click',load);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!button.disabled)load();});
  load();
})();
