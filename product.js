(async()=>{
  const $=id=>document.getElementById(id), id=new URLSearchParams(location.search).get('id');
  try{
    if(!/^\d+$/.test(id||''))throw Error('Đường dẫn sản phẩm không hợp lệ. Vui lòng quay lại cửa hàng.');
    const {product:p}=await cloudAPI('/products/'+id);
    document.title=p.name+' - Anh Em Shop';
    $('detailName').textContent=p.name;$('detailPrice').textContent=Number(p.price).toLocaleString('vi-VN')+'₫';
    $('detailDescription').textContent=p.description||'Liên hệ cửa hàng để biết thêm thông tin sản phẩm.';
    $('detailCategory').textContent=({nam:'Thời trang nam',nu:'Thời trang nữ',phukien:'Phụ kiện'})[p.category]||'Sản phẩm';
    const image=$('detailImage');image.alt=p.name;image.onerror=()=>{image.onerror=null;image.src='assets/images/anhaolv.jpg';};image.src=p.image_url;
    const stock=Math.max(0,Number(p.stock)||0), max=Math.min(99,stock), input=$('detailQuantity');input.max=max||1;
    $('detailStock').textContent=stock?'Còn '+stock+' sản phẩm trong kho':'Sản phẩm tạm hết hàng';
    function quantity(){const number=Number(input.value);const value=Math.min(max||1,Math.max(1,Number.isFinite(number)?Math.trunc(number):1));input.value=value;return value;}
    $('quantityMinus').onclick=()=>{input.value=quantity()-1;quantity();};$('quantityPlus').onclick=()=>{input.value=quantity()+1;quantity();};input.onchange=quantity;
    if(!stock){$('detailAdd').disabled=true;input.disabled=true;$('quantityMinus').disabled=true;$('quantityPlus').disabled=true;}
    $('detailAdd').onclick=async()=>{
      const button=$('detailAdd');button.disabled=true;
      try{
        const saved=localStorage.getItem('anhem_cart');let cart=saved?JSON.parse(saved):[];if(!Array.isArray(cart))cart=[];
        const current=cart.find(item=>String(item.id)===String(p.id)), amount=quantity(), total=(current?Number(current.quantity)||0:0)+amount;
        if(total>max)throw Error('Trong giỏ đã có '+(current?.quantity||0)+' sản phẩm. Tổng số lượng tối đa là '+max+'.');
        if(current){current.quantity=total;current.price=p.price;current.name=p.name;current.img=p.image_url;}
        else cart.push({id:String(p.id),name:p.name,price:p.price,img:p.image_url,quantity:amount});
        localStorage.setItem('anhem_cart',JSON.stringify(cart));
        $('detailMessage').textContent='Đã thêm '+amount+' sản phẩm vào giỏ hàng.';$('detailCheckout').hidden=false;
      }catch(error){$('detailMessage').textContent=error.message;}
      finally{button.disabled=!stock;}
    };
    $('productLoading').hidden=true;$('productDetail').hidden=false;
  }catch(error){$('productLoading').textContent=error.message;}
})();
