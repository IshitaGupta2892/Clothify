(function(){
  const { qs, qsa, setParam, getParam, debounce } = Utils;
  async function init(){
    const [products, categories] = await Promise.all([API.products(), API.categories()]);
    // Populate filters
    const catSel = qs('#filter-category');
    catSel.innerHTML = '<option value="">All</option>' + categories.map(c=>`<option value="${c}">${c}</option>`).join('');
    catSel.value = getParam('category')||'';

    const sizes = Array.from(new Set(products.flatMap(p=>p.sizes||[]))).sort();
    const colors = Array.from(new Set(products.flatMap(p=>p.colors||[]))).sort();
    qs('#filter-sizes').innerHTML = sizes.map(s=>`<button class="chip" data-size="${s}">${s}</button>`).join('');
    qs('#filter-colors').innerHTML = colors.map(c=>`<button class="chip" data-color="${c}">${c}</button>`).join('');

    // Events
    catSel.addEventListener('change', ()=>{ setParam({category: catSel.value||null, page: 1}); render(); });
    const price = qs('#filter-price');
    const priceValue = qs('#filter-price-value');
    const applyPrice = ()=>{ priceValue.textContent = `Up to $${price.value}`; setParam({max: price.value}); render(); };
    price.addEventListener('input', debounce(applyPrice, 100));
    price.value = getParam('max') || 200;
    applyPrice();

    qsa('[data-size]').forEach(b=>b.addEventListener('click', ()=>{ b.classList.toggle('active'); render(); }));
    qsa('[data-color]').forEach(b=>b.addEventListener('click', ()=>{ b.classList.toggle('active'); render(); }));
    qs('#clear-filters').addEventListener('click', ()=>{ location.href = location.pathname; });
    qs('#sort').addEventListener('change', ()=>{ setParam({ page: 1 }); render(); });

    render();
  }

  function currentFilters(){
    const size = Array.from(document.querySelectorAll('[data-size].active')).map(b=>b.dataset.size);
    const color = Array.from(document.querySelectorAll('[data-color].active')).map(b=>b.dataset.color);
    const category = Utils.getParam('category')||'';
    const max = +(Utils.getParam('max')||200);
    const sort = Utils.qs('#sort').value;
    const q = (Utils.getParam('q')||'').trim().toLowerCase();
    const page = Math.max(1, +(Utils.getParam('page')||1));
    return { size, color, category, max, sort, q, page };
  }

  async function render(){
    const list = await API.products();
    const f = currentFilters();
    let results = list.filter(p=>
      (!f.category || p.category===f.category) &&
      p.price <= f.max &&
      (f.size.length===0 || (p.sizes||[]).some(s=>f.size.includes(s))) &&
      (f.color.length===0 || (p.colors||[]).some(c=>f.color.includes(c))) &&
      (!f.q || `${p.name} ${p.brand||''} ${(p.tags||[]).join(' ')}`.toLowerCase().includes(f.q))
    );
    if(f.sort==='price-asc') results.sort((a,b)=>a.price-b.price);
    if(f.sort==='price-desc') results.sort((a,b)=>b.price-a.price);
    if(f.sort==='newest') results.sort((a,b)=> (b.createdAt||0)-(a.createdAt||0) );

    // Pagination
    const pageSize = 12;
    const total = results.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(f.page, totalPages);
    const start = (page - 1) * pageSize;
    const pageItems = results.slice(start, start + pageSize);

    Utils.qs('#results-count').textContent = `${total} results`;
    const grid = Utils.qs('#product-grid');
    grid.innerHTML = pageItems.map(UI.productCard).join('');
    // Bind add-to-cart
    grid.querySelectorAll('[data-add]').forEach(btn=>btn.addEventListener('click', async (e)=>{
      const id = e.currentTarget.getAttribute('data-add');
      const p = await API.productById(id);
      Cart.add(p, {});
      UI.toast('Added to cart');
    }));

    // Render pagination
    const pag = qs('#pagination');
    if(totalPages <= 1){ pag.innerHTML = ''; }
    else {
      const mk = (label, newPage, disabled=false, current=false)=>`<button class="page" ${disabled?'disabled':''} ${current?'aria-current="page"':''} data-page="${newPage}">${label}</button>`;
      let html = '';
      html += mk('Prev', Math.max(1, page-1), page===1, false);
      // window of pages
      const windowSize = 5;
      const startPage = Math.max(1, page - Math.floor(windowSize/2));
      const endPage = Math.min(totalPages, startPage + windowSize - 1);
      for(let i=startPage;i<=endPage;i++) html += mk(String(i), i, false, i===page);
      html += mk('Next', Math.min(totalPages, page+1), page===totalPages, false);
      pag.innerHTML = html;
      pag.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click', (e)=>{
        const np = +e.currentTarget.getAttribute('data-page');
        setParam({ page: np });
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }));
    }
  }

  if(document.body.dataset.page==='shop') init();
})();
