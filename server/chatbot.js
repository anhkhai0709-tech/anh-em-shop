export const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
const money=n=>Number(n).toLocaleString('vi-VN')+'₫';
export async function answerShop(DB,message,contextId){
 const q=normalize(message);
 if(/don hang|duyet don|da duyet|trang thai don/.test(q))return{reply:'Bạn đăng nhập, chọn “Đơn hàng của tôi” để xem trạng thái Chờ duyệt, Đã duyệt, Đang giao, Đã giao hoặc Đã hủy. Nhấn “Cập nhật trạng thái” để lấy thông tin mới.',links:[{label:'Xem đơn hàng của tôi',url:'orders.html'}]};
 if(/dat hang|mua hang|thanh toan/.test(q))return{reply:'Bạn đăng nhập, chọn sản phẩm và số lượng, thêm vào giỏ hàng, rồi nhấn “Đặt hàng ngay”. Điền họ tên, số điện thoại, địa chỉ nhận hàng và gửi đơn. Phương thức thanh toán cụ thể cần xác nhận với cửa hàng.',links:[{label:'Về cửa hàng',url:'index.html#products'}]};
 if(/doi tra|bao hanh|phi ship|phi giao|mien phi.*ship|giao hang.*(bao lau|may ngay)|chat lieu|size|kich co/.test(q)&&!/chat lieu/.test(q))return{reply:'Thông tin này chưa được cửa hàng cập nhật đầy đủ trong dữ liệu sản phẩm. Bạn liên hệ cửa hàng để xác nhận; tôi không tự suy đoán phí giao hàng, kích cỡ hoặc chính sách đổi trả.',links:[{label:'Liên hệ cửa hàng',url:'index.html#contact'}]};
 if(/lien he|so dien thoai|dia chi shop/.test(q))return{reply:'Bạn xem thông tin liên hệ đang hiển thị trên trang cửa hàng để được tư vấn trực tiếp.',links:[{label:'Thông tin liên hệ',url:'index.html#contact'}]};
 const products=(await DB.prepare('SELECT id,name,category,price,description,stock FROM products ORDER BY id DESC LIMIT 200').all()).results;
 const stop=new Set('toi ban minh cho hoi ve san pham co khong nao gi la cua shop web website gia bao nhieu tien con hang thong tin xem muon tim hieu them chi tiet duoi tren tu den tam khoang voi va hay goi y giup loai mua duoc tot re nhat xin chao cam on trong chat lieu'.split(' '));
 const words=q.replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w&&!stop.has(w)&&!/^\d/.test(w));
 const budget=q.match(/(duoi|tren|toi da|it hon|lon hon|khong qua)\s*(\d+(?:[.,]\d+)?)\s*(trieu|tr|k|nghin|ngan|dong|d)?/);
 const limit=budget?Number(budget[2].replace(',','.'))*(/^(trieu|tr)$/.test(budget[3])?1000000:/^(k|nghin|ngan)$/.test(budget[3])?1000:1):null;
 let candidates=products.map(p=>{const name=normalize(p.name),description=normalize(p.description||''),category=({nam:'nam',nu:'nu',phukien:'phu kien'})[p.category]||'';return{...p,score:(q.includes(name)?100:0)+words.reduce((n,w)=>n+(name.includes(w)?3:category.includes(w)?2:description.includes(w)?1:0),0)};});
 if(words.length)candidates=candidates.filter(p=>p.score>0).sort((a,b)=>b.score-a.score||a.price-b.price);
 else if(contextId&&!budget&&!/tat ca|danh sach|goi y|san pham nao/.test(q))candidates=candidates.filter(p=>p.id===Number(contextId));
 if(limit!==null)candidates=candidates.filter(p=>/tren|lon hon/.test(budget[1])?p.price>limit:p.price<=limit);
 if(candidates[0]?.score>=100)candidates=candidates.filter(p=>p.score>=100);
 if(!words.length&&!contextId&&!budget&&!/san pham|goi y|ban gi|xin chao|^chao|danh sach|tat ca/.test(q))return{reply:'Tôi hỗ trợ tra cứu sản phẩm và hướng dẫn sử dụng cửa hàng. Bạn thử hỏi “Áo phông LV giá bao nhiêu?”, “Có áo dưới 300k không?” hoặc “Xem đơn hàng ở đâu?”.'};
 if(!candidates.length)return{reply:'Tôi chưa tìm thấy sản phẩm phù hợp trong dữ liệu cửa hàng. Bạn thử tên ngắn hơn hoặc chọn một sản phẩm để xem chi tiết.',links:[{label:'Xem sản phẩm',url:'index.html#products'}]};
 const selected=candidates.slice(0,4);
 return{reply:selected.length===1?'Đây là thông tin sản phẩm đang được cửa hàng lưu:':'Tôi tìm thấy các sản phẩm phù hợp sau:',products:selected.map(p=>({id:p.id,name:p.name,price:money(p.price),description:p.description||'Chưa có mô tả chi tiết.',stock:Math.max(0,Number(p.stock)||0),url:'product.html?id='+p.id})),contextId:selected.length===1?selected[0].id:null};
}
