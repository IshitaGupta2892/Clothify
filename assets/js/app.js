(function(){
  const { qs } = Utils;
  async function loadPartials(){
    const [h, f] = await Promise.all([
      fetch('./partials/header.html').then(r=>r.text()),
      fetch('./partials/footer.html').then(r=>r.text())
    ]);
    qs('#app-header').innerHTML = h;
    qs('#app-footer').innerHTML = f;
    const yearEl = document.getElementById('year'); if(yearEl) yearEl.textContent = new Date().getFullYear();
    updateCartBadge();
  }
  function updateCartBadge(){
    const badge = document.getElementById('cart-badge');
    if(!badge) return; const count = Cart.totals().count; badge.textContent = String(count);
  }
  async function initHome(){
    const grid = document.getElementById('best-sellers');
    grid.innerHTML = '<div class="loader"></div>';
    const list = (await API.products()).slice(0,8);
    grid.innerHTML = list.map(UI.productCard).join('');
    grid.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click', async (e)=>{
      const id = e.currentTarget.getAttribute('data-add');
      const p = await API.productById(id); Cart.add(p, {}); UI.toast('Added to cart');
    }));
  }
  async function initProduct(){
    const id = Utils.getParam('id');
    if(!id){
      console.error('[initProduct] Missing id param in URL', location.href);
      try{
        const last = sessionStorage.getItem('last_product_id');
        if(last){
          const url = new URL(location.href);
          url.searchParams.set('id', last);
          location.replace(url.toString());
          return;
        }
      }catch(e){ /* no-op */ }
      const el = document.getElementById('product-detail');
      el.innerHTML = '<p>Product not found (missing id).</p>';
      return;
    }
    const p = await API.productById(id);
    const el = document.getElementById('product-detail');
    if(!p){
      const list = await API.products();
      console.error('[initProduct] Product not found for id=', id, 'Available ids=', list.map(x=>x.id));
      el.innerHTML = '<p>Product not found.</p>';
      return;
    }
    el.innerHTML = `
      <div class="product-detail__gallery">
        <img class="main-image" src="${p.images?.[0]||'./assets/img/placeholder.png'}" alt="${p.name}" onerror="this.onerror=null;this.src='./assets/img/placeholder.png'"/>
        <div class="thumbs">
          ${(p.images||[]).map((img,i)=>`<img ${i===0?'class="active"':''} src="${img}" data-src="${img}" alt="${p.name} thumbnail ${i+1}" loading="lazy" onerror="this.onerror=null;this.src='./assets/img/placeholder.png'">`).join('')}
        </div>
      </div>
      <div class="product-detail__panel">
        <h1>${p.name}</h1>
        <div class="product-card__meta"><span>${p.brand||''}</span></div>
        <div class="product-detail__price">${Utils.fmtCurrency(p.price, p.currency||'USD')}</div>
        <div>
          <div class="variant-row">${(p.sizes||[]).map(s=>`<button class="chip" data-size="${s}">${s}</button>`).join('')}</div>
          <div class="variant-row">${(p.colors||[]).map(c=>`<button class="chip" data-color="${c}">${c}</button>`).join('')}</div>
        </div>
        <div class="variant-row">
          <label class="sr-only" for="qty">Qty</label>
          <select id="qty">${Array.from({length:10},(_,i)=>`<option>${i+1}</option>`).join('')}</select>
          <button id="add-to-cart" class="btn btn--primary">Add to cart</button>
        </div>
        <p class="muted">${p.description||''}</p>
      </div>`;
    // Gallery interactions
    const mainImg = el.querySelector('.product-detail__gallery .main-image');
    el.querySelectorAll('.thumbs img').forEach(thumb=>{
      thumb.addEventListener('click', ()=>{
        mainImg.src = thumb.dataset.src || thumb.src;
        el.querySelectorAll('.thumbs img').forEach(t=>t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
    let sel = { size: p.sizes?.[0], color: p.colors?.[0] };
    el.querySelectorAll('[data-size]').forEach(b=>b.addEventListener('click',()=>{ el.querySelectorAll('[data-size]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); sel.size=b.dataset.size; }));
    el.querySelectorAll('[data-color]').forEach(b=>b.addEventListener('click',()=>{ el.querySelectorAll('[data-color]').forEach(x=>x.classList.remove('active')); b.classList.add('active'); sel.color=b.dataset.color; }));
    qs('#add-to-cart').addEventListener('click', ()=>{ const qty = +qs('#qty').value; Cart.add(p, { qty, size: sel.size, color: sel.color }); UI.toast('Added to cart'); });

    // Related
    const related = (await API.products()).filter(x=>x.category===p.category && x.id!==p.id).slice(0,4);
    document.getElementById('related-grid').innerHTML = related.map(UI.productCard).join('');
  }
  async function initCart(){
    const cont = document.getElementById('cart-container');
    const sum = document.getElementById('cart-summary');
    function render(){
      const items = Cart.items();
      if(items.length===0){ cont.innerHTML='<p>Your cart is empty.</p>'; sum.innerHTML=''; updateCartBadge(); return; }
      cont.innerHTML = items.map(x=>`
        <div class="cart-item">
          <img src="${x.image||'./assets/img/placeholder.png'}" alt="${x.name}" onerror="this.onerror=null;this.src='./assets/img/placeholder.png'">
          <div>
            <strong>${x.name}</strong>
            <div class="muted">${x.color||''} ${x.size||''}</div>
            <div>${Utils.fmtCurrency(x.price)}</div>
          </div>
          <div>
            <label class="sr-only" for="qty-${x.sku}">Qty</label>
            <select id="qty-${x.sku}" data-sku="${x.sku}">${Array.from({length:10},(_,i)=>`<option ${x.qty===i+1?'selected':''}>${i+1}</option>`).join('')}</select>
            <button class="btn" data-remove="${x.sku}">Remove</button>
          </div>
        </div>`).join('');
      const t = Cart.totals();
      sum.innerHTML = `
        <h3>Order Summary</h3>
        <div class="muted">Subtotal: ${Utils.fmtCurrency(t.subtotal)}</div>
        <div class="muted">Shipping: ${Utils.fmtCurrency(t.shipping)}</div>
        <div class="muted">Tax: ${Utils.fmtCurrency(t.tax)}</div>
        <h2>Total: ${Utils.fmtCurrency(t.total)}</h2>
        <a class="btn btn--primary" href="./checkout.html">Checkout</a>`;
      cont.querySelectorAll('[id^="qty-"]').forEach(sel=>sel.addEventListener('change', (e)=>{ Cart.update(e.currentTarget.dataset.sku, +e.currentTarget.value); render(); updateCartBadge(); }));
      cont.querySelectorAll('[data-remove]').forEach(btn=>btn.addEventListener('click', (e)=>{ Cart.remove(e.currentTarget.dataset.remove); render(); updateCartBadge(); }));
    }
    render();
  }
  async function initCheckout(){
    // Show summary
    const sum = document.getElementById('order-summary');
    const t = Cart.totals();
    sum.innerHTML = `<h3>Summary</h3><div class="muted">Items: ${t.count}</div><div class="muted">Subtotal: ${Utils.fmtCurrency(t.subtotal)}</div><div class="muted">Shipping: ${Utils.fmtCurrency(t.shipping)}</div><div class="muted">Tax: ${Utils.fmtCurrency(t.tax)}</div><h2>Total: ${Utils.fmtCurrency(t.total)}</h2>`;
    // Form submit
    const form = document.getElementById('checkout-form');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      if(!form.reportValidity()) return;
      const orderId = 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase();
      localStorage.setItem('clothify_last_order', JSON.stringify({ id: orderId, total: t.total, at: Date.now() }));
      Cart.clear();
      location.href = './order-confirmation.html?id='+orderId;
    });
  }
  function initOrderConfirmation(){
    const id = Utils.getParam('id');
    const el = document.getElementById('order-id');
    if(el) el.textContent = id || (JSON.parse(localStorage.getItem('clothify_last_order')||'{}').id||'');
  }

  document.addEventListener('cart:change', updateCartBadge);
  loadPartials().then(()=>{
    const page = document.body.dataset.page;
    if(page==='home') initHome();
    if(page==='product') initProduct();
    if(page==='cart') initCart();
    if(page==='checkout') initCheckout();
    if(page==='order-confirmation') initOrderConfirmation();
  });
})();
