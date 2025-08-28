window.UI = (function(){
  let toastEl;
  function ensureToast(){
    if(!toastEl){ toastEl = document.createElement('div'); toastEl.className='toast'; document.body.appendChild(toastEl); }
  }
  function toast(msg){ ensureToast(); toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'), 1800); }
  function productCard(p){
    return `
      <article class="product-card">
        <a href="./product.html?id=${encodeURIComponent(p.id)}" onclick="try{sessionStorage.setItem('last_product_id','${p.id}')}catch(e){}">
          <img src="${(p.images&&p.images[0])||'./assets/img/placeholder.png'}" alt="${p.name}" loading="lazy" onerror="this.onerror=null;this.src='./assets/img/placeholder.png'" />
        </a>
        <div class="product-card__body">
          <h3 class="product-card__name">${p.name}</h3>
          <div class="product-card__meta"><span>${p.brand||''}</span><span>${Utils.fmtCurrency(p.price, p.currency||'USD')}</span></div>
          <button class="btn btn--secondary" data-add="${p.id}">Add to cart</button>
        </div>
      </article>`;
  }
  return { toast, productCard };
})();
