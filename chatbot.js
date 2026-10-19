(() => {
 const style=document.createElement('link');style.rel='stylesheet';style.href='chatbot.css';document.head.append(style);
 const widget=document.createElement('div');widget.className='shop-chat';
 widget.innerHTML=`<button class="shop-chat-toggle" aria-label="Mở trợ lý sản phẩm" aria-expanded="false" aria-controls="shopChatPanel"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11a9 9 0 0 1-9 9H5l-4 3V11a10 10 0 0 1 20 0Z"/><path d="M7 9h10M7 13h7"/></svg></button><section class="shop-chat-panel" id="shopChatPanel" aria-label="Trợ lý Anh Em Shop" hidden><header><div><strong>Trợ lý Anh Em Shop</strong><span>Hỏi đáp theo thông tin sản phẩm</span></div><button class="shop-chat-close" aria-label="Đóng chatbot">×</button></header><div class="shop-chat-messages" role="log" aria-live="polite"></div><div class="shop-chat-suggestions"><button type="button">Tư vấn quần áo</button><button type="button">Chọn size giúp tôi</button></div><form class="shop-chat-form"><label class="shop-chat-sr" for="shopChatInput">Câu hỏi về sản phẩm</label><textarea id="shopChatInput" rows="1" maxlength="500" placeholder="Nhập câu hỏi về sản phẩm…" required></textarea><button type="submit">Gửi</button></form></section>`;
 document.body.append(widget);
 const panel=widget.querySelector('section'),toggle=widget.querySelector('.shop-chat-toggle'),messages=widget.querySelector('.shop-chat-messages'),form=widget.querySelector('form'),input=widget.querySelector('textarea'),submit=form.querySelector('button');
 const history=[];
 let busy=false,contextId=location.pathname.replace(/\.html$/,'')==='/product'?new URLSearchParams(location.search).get('id'):null;
 function bubble(text,type='bot'){const div=document.createElement('div');div.className='shop-chat-bubble '+type;div.textContent=text;messages.append(div);messages.scrollTop=messages.scrollHeight;return div;}
 function open(value){panel.hidden=!value;toggle.setAttribute('aria-expanded',String(value));if(value)input.focus();else toggle.focus();}
 toggle.onclick=()=>open(panel.hidden);widget.querySelector('.shop-chat-close').onclick=()=>open(false);
 widget.addEventListener('keydown',event=>{if(event.key==='Escape')open(false);});
 bubble('Xin chào đến với Anh Em Shop bạn cần tư vấn hãy nêu mong muốn');
 async function send(question){
  if(busy||!question.trim())return;busy=true;submit.disabled=true;input.disabled=true;bubble(question,'user');input.value='';const waiting=bubble('Đang tra cứu…');
  try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,contextId,history:history.slice(-6)})});const data=await response.json();if(!response.ok)throw Error(data.error||'Không thể tra cứu lúc này');waiting.textContent=data.reply;history.push({role:'user',content:question},{role:'assistant',content:data.reply.slice(0,500)});if(history.length>6)history.splice(0,history.length-6);
   if(Object.hasOwn(data,'contextId'))contextId=data.contextId;
   for(const p of data.products||[]){const card=document.createElement('div');card.className='shop-chat-product';const link=document.createElement('a');link.href=p.url;link.textContent=p.name;const price=document.createElement('strong');price.textContent=p.price;const description=document.createElement('p');description.textContent=p.description;const stock=document.createElement('small');stock.textContent=p.stock?'Còn '+p.stock+' sản phẩm trong kho':'Tạm hết hàng';card.append(link,price,description,stock);waiting.append(card);}
   for(const l of data.links||[]){const link=document.createElement('a');link.className='shop-chat-link';link.href=l.url;link.textContent=l.label+' →';waiting.append(link);}
   const source=document.createElement('small');source.className='shop-chat-source';source.textContent=data.source==='ai'?'AI · Có thể có sai sót, chưa tra cứu Internet trực tiếp':'Thông tin cửa hàng';waiting.append(source);
  }catch(error){waiting.textContent=error.message+' Bạn có thể thử gửi lại.';}
  finally{busy=false;submit.disabled=false;input.disabled=false;messages.scrollTop=messages.scrollHeight;if(!panel.hidden)input.focus();}
 }
 form.onsubmit=event=>{event.preventDefault();send(input.value.trim());};
 input.onkeydown=event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();send(input.value.trim());}};
 widget.querySelectorAll('.shop-chat-suggestions button').forEach(button=>button.onclick=()=>send(button.textContent));
})();
