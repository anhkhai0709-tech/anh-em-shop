/* ===== Anh Em Shop - Main JavaScript (Mobile First & Cloudflare Workers Backend) ===== */

(function () {
    'use strict';

    // ===== DOM Elements =====
    const header = document.getElementById('header');
    const hamburger = document.getElementById('hamburger');
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');
    const contactForm = document.getElementById('contactForm');
    const toast = document.getElementById('toast');
    const toastClose = document.getElementById('toastClose');
    const toastMessage = document.getElementById('toastMessage');
    const searchInput = document.getElementById('searchInput');
    const productsGrid = document.getElementById('productsGrid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const headerLinks = document.querySelectorAll('.header__link');

    // ===== Cart Elements =====
    const cartToggleBtn = document.getElementById('cartToggleBtn');
    const cartCloseBtn = document.getElementById('cartCloseBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    const cartOverlay = document.getElementById('cartOverlay');
    const cartBadgeCount = document.getElementById('cartBadgeCount');
    const cartTotalCount = document.getElementById('cartTotalCount');
    const cartTotalPrice = document.getElementById('cartTotalPrice');
    const cartDrawerBody = document.getElementById('cartDrawerBody');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const messageInput = document.getElementById('message');

    // ===== Auth Elements =====
    const openAuthModalBtn = document.getElementById('openAuthModalBtn');
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
    const authModalOverlay = document.getElementById('authModalOverlay');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabRegisterBtn = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authHeaderWidget = document.getElementById('authHeaderWidget');

    // ===== Cart State =====
    let cart = JSON.parse(localStorage.getItem('anhem_cart')) || [];

    function saveCart() {
        localStorage.setItem('anhem_cart', JSON.stringify(cart));
        updateCartUI();
    }

    function formatPrice(price) {
        return parseInt(price, 10).toLocaleString('vi-VN') + '₫';
    }

    // Helper: Require Login to Purchase
    function checkAuthForPurchase() {
        const user = JSON.parse(localStorage.getItem('anhem_user'));
        if (!user) {
            showToast('⚠️ Vui lòng đăng nhập tài khoản để mua hàng!');
            openAuthModal();
            return false;
        }
        return true;
    }

    function updateCartUI() {
        let totalCount = 0;
        let totalPrice = 0;

        cart.forEach(function (item) {
            totalCount += item.quantity;
            totalPrice += item.price * item.quantity;
        });

        if (cartBadgeCount) cartBadgeCount.textContent = totalCount;
        if (cartTotalCount) cartTotalCount.textContent = totalCount;
        if (cartTotalPrice) cartTotalPrice.textContent = formatPrice(totalPrice);

        if (cartDrawerBody) {
            if (cart.length === 0) {
                cartDrawerBody.innerHTML = `
                    <div class="cart-empty">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        <p>Giỏ hàng của bạn đang trống</p>
                    </div>
                `;
            } else {
                let html = '';
                cart.forEach(function (item, index) {
                    const imgTag = item.img 
                        ? `<img src="${escapeHTML(item.img)}" alt="${escapeHTML(item.name)}" class="cart-item__img">`
                        : `<div class="cart-item__img" style="background:#eef2ff;display:flex;align-items:center;justify-content:center;font-size:20px;">👕</div>`;

                    html += `
                        <div class="cart-item" data-index="${index}">
                            ${imgTag}
                            <div class="cart-item__info">
                                <h4 class="cart-item__name">${escapeHTML(item.name)}</h4>
                                <span class="cart-item__price">${formatPrice(item.price)}</span>
                                <div class="cart-item__qty">
                                    <button class="cart-item__qty-btn qty-minus" data-index="${index}">-</button>
                                    <span class="cart-item__qty-num">${item.quantity}</span>
                                    <button class="cart-item__qty-btn qty-plus" data-index="${index}">+</button>
                                </div>
                            </div>
                            <button class="cart-item__remove" data-index="${index}" title="Xóa">&times;</button>
                        </div>
                    `;
                });
                cartDrawerBody.innerHTML = html;
            }
        }
    }

    // Toggle Cart Drawer
    function openCart() {
        if (cartDrawer && cartOverlay) {
            cartDrawer.classList.add('active');
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCart() {
        if (cartDrawer && cartOverlay) {
            cartDrawer.classList.remove('active');
            cartOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (cartToggleBtn) cartToggleBtn.addEventListener('click', openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    if (cartDrawerBody) {
        cartDrawerBody.addEventListener('click', function (e) {
            const target = e.target;
            const index = parseInt(target.getAttribute('data-index'), 10);

            if (target.classList.contains('qty-plus')) {
                cart[index].quantity += 1;
                saveCart();
            } else if (target.classList.contains('qty-minus')) {
                if (cart[index].quantity > 1) {
                    cart[index].quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
                saveCart();
            } else if (target.classList.contains('cart-item__remove')) {
                const removedName = cart[index].name;
                cart.splice(index, 1);
                saveCart();
                showToast(`Đã xóa "${removedName}" khỏi giỏ hàng!`);
            }
        });
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function () {
            if (cart.length === 0) return;
            if (confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm trong giỏ hàng?')) {
                cart = [];
                saveCart();
                showToast('Đã xóa sạch giỏ hàng!');
            }
        });
    }

    // Add to Cart Function
    function addToCart(product, openDrawer = false) {
        if (!checkAuthForPurchase()) return;

        const existingIndex = cart.findIndex(item => item.id === product.id);
        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: parseInt(product.price, 10),
                img: product.img,
                quantity: 1
            });
        }
        saveCart();
        showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);

        if (openDrawer) openCart();
    }

    document.addEventListener('click', function (e) {
        const addBtn = e.target.closest('.add-to-cart-btn');
        const buyBtn = e.target.closest('.buy-now-btn');

        if (addBtn) {
            const product = {
                id: addBtn.getAttribute('data-id'),
                name: addBtn.getAttribute('data-name'),
                price: addBtn.getAttribute('data-price'),
                img: addBtn.getAttribute('data-img')
            };
            addToCart(product, false);
        } else if (buyBtn) {
            if (!checkAuthForPurchase()) return;

            const product = {
                id: buyBtn.getAttribute('data-id'),
                name: buyBtn.getAttribute('data-name'),
                price: buyBtn.getAttribute('data-price'),
                img: buyBtn.getAttribute('data-img')
            };
            addToCart(product, false);
            populateCheckoutForm();
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    function populateCheckoutForm() {
        if (cart.length === 0 || !messageInput) return;

        let summaryText = 'ĐƠN HÀNG CỦA BẠN:\n';
        let total = 0;

        cart.forEach((item, i) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            summaryText += `${i + 1}. ${escapeHTML(item.name)} - SL: ${item.quantity} x ${formatPrice(item.price)} = ${formatPrice(itemTotal)}\n`;
        });

        summaryText += `\nTỔNG CỘNG: ${formatPrice(total)}`;
        messageInput.value = summaryText;
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            if (!checkAuthForPurchase()) return;

            if (cart.length === 0) {
                showToast('Giỏ hàng trống! Hãy thêm sản phẩm trước.');
                return;
            }
            populateCheckoutForm();
            closeCart();
            const contactSection = document.getElementById('contact');
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
            showToast('Đã chuyển đơn hàng sang form Liên Hệ. Hãy điền thông tin để chốt đơn!');
        });
    }

    updateCartUI();

    // ===== AUTHENTICATION (USER & ADMIN) =====
    function updateAuthHeaderUI() {
        if (!authHeaderWidget) return;
        const user = JSON.parse(localStorage.getItem('anhem_user'));

        document.body.classList.toggle('signed-in', !!user);
        if (user) {
            const adminBadge = user.role === 'admin' 
                ? `<a href="admin.html" class="btn btn--sm btn--primary">Quản trị</a>` 
                : '';
            
            authHeaderWidget.innerHTML = `
                <div class="auth-header-actions">
                    ${adminBadge}
                    <a href="orders.html" class="btn btn--sm btn--outline">Đơn hàng của tôi</a>
                    <span class="auth-user-name" style="font-size:0.8125rem;font-weight:600;">👋 ${escapeHTML(user.username)}</span>
                    <button class="btn btn--sm btn--outline" id="userLogoutBtn">Thoát</button>
                </div>
            `;

            document.getElementById('userLogoutBtn').addEventListener('click', async function() {
                try { await cloudAPI('/auth/logout', {method:'POST'}); }
                catch(error) { showToast(error.message); return; }
                localStorage.removeItem('anhem_user');
                localStorage.removeItem('anhem_token');
                showToast('Đã đăng xuất tài khoản');
                updateAuthHeaderUI();
            });
        } else {
            authHeaderWidget.innerHTML = `<button class="btn btn--outline btn--sm" id="openAuthModalBtn">Đăng nhập / Đăng ký</button>`;
            const newOpenBtn = document.getElementById('openAuthModalBtn');
            if (newOpenBtn) newOpenBtn.addEventListener('click', openAuthModal);
        }
    }

    function openAuthModal() {
        if (authModalOverlay) authModalOverlay.classList.add('active');
    }

    function closeAuthModal() {
        if (authModalOverlay) authModalOverlay.classList.remove('active');
    }

    if (openAuthModalBtn) openAuthModalBtn.addEventListener('click', openAuthModal);
    if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);
    if (authModalOverlay) {
        authModalOverlay.addEventListener('click', function(e) {
            if (e.target === authModalOverlay) closeAuthModal();
        });
    }

    if (tabLoginBtn && tabRegisterBtn) {
        tabLoginBtn.addEventListener('click', function() {
            tabLoginBtn.style.borderBottom = '2px solid var(--primary)';
            tabLoginBtn.style.color = 'var(--text-primary)';
            tabRegisterBtn.style.borderBottom = 'none';
            tabRegisterBtn.style.color = 'var(--text-muted)';
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        });

        tabRegisterBtn.addEventListener('click', function() {
            tabRegisterBtn.style.borderBottom = '2px solid var(--primary)';
            tabRegisterBtn.style.color = 'var(--text-primary)';
            tabLoginBtn.style.borderBottom = 'none';
            tabLoginBtn.style.color = 'var(--text-muted)';
            registerForm.style.display = 'block';
            loginForm.style.display = 'none';
        });
    }

    if (loginForm) loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            const data = await cloudAPI('/auth/login', {method:'POST',body:JSON.stringify({username:document.getElementById('loginUsername').value.trim(),password:document.getElementById('loginPassword').value})});
            localStorage.setItem('anhem_user',JSON.stringify(data.user));
            showToast('Đăng nhập thành công');
            authModalOverlay.classList.remove('active'); updateAuthHeaderUI();
            if(data.user.role === 'admin') location.href='admin.html';
        } catch(error) { showToast(error.message); }
    });
    if (registerForm) registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        try {
            await cloudAPI('/auth/register',{method:'POST',body:JSON.stringify({username:document.getElementById('regUsername').value.trim(),email:document.getElementById('regEmail').value.trim(),password:document.getElementById('regPassword').value})});
            showToast('Đăng ký thành công. Bạn có thể đăng nhập.'); tabLoginBtn.click();
            document.getElementById('loginUsername').value=document.getElementById('regUsername').value.trim();
        } catch(error) { showToast(error.message); }
    });
    cloudAPI('/auth/me').then(({user})=>{if(user)localStorage.setItem('anhem_user',JSON.stringify(user));else localStorage.removeItem('anhem_user');updateAuthHeaderUI();}).catch(()=>{localStorage.removeItem('anhem_user');updateAuthHeaderUI();});

    updateAuthHeaderUI();

    // Render Admin Custom Products if added (with API & LocalStorage sync)
    async function renderCustomProducts() {
        if (!productsGrid) return;
        let customProds;
        try {
            const data=await cloudAPI('/products');
            customProds=data.products.map(p=>Object.fromEntries(Object.entries(p).map(([k,v])=>[k,typeof v==='string'?escapeHTML(v):v])));
            productsGrid.innerHTML='';
        } catch(error) { productsGrid.innerHTML='<p>Không tải được sản phẩm. Vui lòng thử lại.</p>'; showToast(error.message); return; }

        customProds.forEach(prod => {
            if (document.querySelector(`[data-id="${prod.id}"]`)) return;
            const article = document.createElement('article');
            article.className = 'product-card animate-on-scroll visible';
            article.setAttribute('data-category', prod.category || 'nam');
            article.innerHTML = `
                <a class="product-card__image" href="product.html?id=${prod.id}" aria-label="Xem chi tiết ${prod.name}" style="display:block;">
                    <img src="${prod.image_url}" alt="${prod.name}" loading="lazy" onerror="this.onerror=null; this.src='assets/images/anhaolv.jpg';">
                    ${prod.badge ? `<span class="product-card__badge product-card__badge--hot">${prod.badge}</span>` : ''}
                </a>
                <div class="product-card__content">
                    <h3 class="product-card__name"><a href="product.html?id=${prod.id}">${prod.name}</a></h3>
                    <p class="product-card__desc">${prod.description || 'Sản phẩm mới từ Anh Em Shop'}</p>
                    <div class="product-card__footer">
                        <div class="product-card__price-row">
                            <span class="product-card__price">${formatPrice(prod.price)}</span>
                        </div>
                        <div class="product-card__actions">
                            <button class="btn btn--sm btn--outline add-to-cart-btn" data-id="${prod.id}" data-name="${prod.name}" data-price="${prod.price}" data-img="${prod.image_url}">
                                + Giỏ hàng
                            </button>
                            <button class="btn btn--sm btn--primary buy-now-btn" data-id="${prod.id}" data-name="${prod.name}" data-price="${prod.price}" data-img="${prod.image_url}">
                                Mua ngay
                            </button>
                        </div>
                    </div>
                </div>
            `;
            productsGrid.prepend(article);
        });
    }

    renderCustomProducts();

    // ===== Mobile Menu =====
    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.classList.add('header__overlay');
        overlay.id = 'headerOverlay';
        document.body.appendChild(overlay);
        return overlay;
    }

    const overlay = createOverlay();

    function toggleMenu() {
        if (hamburger && navbar) {
            hamburger.classList.toggle('active');
            navbar.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = navbar.classList.contains('active') ? 'hidden' : '';
        }
    }

    function closeMenu() {
        if (hamburger && navbar) {
            hamburger.classList.remove('active');
            navbar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    if (hamburger) hamburger.addEventListener('click', toggleMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    headerLinks.forEach(function (link) {
        link.addEventListener('click', closeMenu);
    });

    // ===== Header Scroll Effect =====
    function handleScroll() {
        var scrollY = window.scrollY;
        if (header) {
            if (scrollY > 50) {
                header.classList.add('header--scrolled');
            } else {
                header.classList.remove('header--scrolled');
            }
        }

        if (backToTop) {
            if (scrollY > 500) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    if (backToTop) {
        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ===== Scroll Animations =====
    function initScrollAnimations() {
        var animatedElements = document.querySelectorAll('.animate-on-scroll');
        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });
            animatedElements.forEach(function (el) { observer.observe(el); });
        } else {
            animatedElements.forEach(function (el) { el.classList.add('visible'); });
        }
    }

    initScrollAnimations();

    // Apply category and text search together.
    function applyFilters(){
        const category=document.querySelector('.filter-btn.active')?.dataset.filter||'all';
        const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase();
        const query=norm(searchInput?.value.trim()||'');
        productsGrid?.querySelectorAll('.product-card').forEach(card=>{
            const match=(category==='all'||card.dataset.category===category)&&norm(card.textContent).includes(query);
            card.classList.toggle('hidden',!match);
        });
    }
    filterBtns.forEach(btn=>btn.addEventListener('click',()=>{
        filterBtns.forEach(b=>b.classList.remove('active'));btn.classList.add('active');applyFilters();
    }));
    searchInput?.addEventListener('input',applyFilters);

    // ===== Form Submission / Order Submission =====
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            if (!checkAuthForPurchase()) return;

            const fullName = document.getElementById('fullName').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const addressEl = document.getElementById('address');
            const address = addressEl ? addressEl.value.trim() : '';
            const email = document.getElementById('email').value.trim();
            const notes = document.getElementById('message').value.trim();

            if (!fullName || !phone || !address) {
                showToast('Vui lòng điền đầy đủ Họ và tên, Số điện thoại và Địa chỉ giao hàng!');
                return;
            }

            const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
            const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

            const orderData = {
                id: orderId,
                customer_name: fullName,
                customer_email: email,
                customer_phone: phone,
                phone: phone,
                email: email,
                address: address,
                shipping_address: address,
                notes: notes,
                items: cart,
                total: totalAmount,
                total_amount: totalAmount,
                status: 'Chờ duyệt',
                date: new Date().toISOString().split('T')[0]
            };

            const submitButton=contactForm.querySelector('[type="submit"]');
            if(submitButton.disabled) return;
            submitButton.disabled=true;
            let savedOrder;
            try { savedOrder=await cloudAPI('/orders',{method:'POST',body:JSON.stringify(orderData)}); }
            catch(error) { showToast(error.message); return; }
            finally { submitButton.disabled=false; }
            showToast(`Đã lưu đơn #${savedOrder.order_id.slice(0,8)}. Tổng tiền: ${formatPrice(savedOrder.total_amount)}`);
            let receipt = document.getElementById('orderReceipt');
            if (!receipt) { receipt = document.createElement('p'); receipt.id='orderReceipt'; contactForm.after(receipt); }
            window.trackShop?.('order_success');
            receipt.innerHTML = `Đặt hàng thành công. <a href="orders.html" style="color:var(--primary);font-weight:700;">Xem đơn hàng và trạng thái duyệt →</a>`;
            contactForm.reset();
            cart = [];
            saveCart();
        });
    }

    // ===== Toast Notification =====
    var toastTimeout;

    function showToast(message) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.classList.add('visible');

        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function () {
            toast.classList.remove('visible');
        }, 4000);
    }

    if (toastClose) {
        toastClose.addEventListener('click', function () {
            toast.classList.remove('visible');
            if (toastTimeout) clearTimeout(toastTimeout);
        });
    }

    // ===== Keyboard Accessibility =====
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeMenu();
            closeCart();
            closeAuthModal();
        }
    });

    handleScroll();

})();
