window.Cart = (function(){
  const KEY='clothify_cart_v1';
  function _load(){ try{ return JSON.parse(localStorage.getItem(KEY))||[] }catch(e){ return [] } }
  function _save(items){ localStorage.setItem(KEY, JSON.stringify(items)); document.dispatchEvent(new CustomEvent('cart:change')); }
  function items(){ return _load(); }
  function add(product, opts={}){
    const it = _load();
    const sku = opts.sku || product.variants?.[0]?.sku || product.id;
    const idx = it.findIndex(x=>x.sku===sku);
    if(idx>-1){ it[idx].qty += (opts.qty||1); }
    else{ it.push({ sku, productId: product.id, name: product.name, price: product.price, qty: opts.qty||1, color: opts.color||product.colors?.[0], size: opts.size||product.sizes?.[0], image: product.images?.[0] }); }
    _save(it);
    return it;
  }
  function update(sku, qty){ const it=_load(); const i=it.findIndex(x=>x.sku===sku); if(i>-1){ it[i].qty=qty; if(qty<=0) it.splice(i,1); _save(it);} }
  function remove(sku){ const it=_load().filter(x=>x.sku!==sku); _save(it); }
  function clear(){ _save([]); }
  function totals(){ const it=_load(); const subtotal = it.reduce((s,x)=>s+x.price*x.qty,0); const shipping = subtotal>100?0:7.99; const tax = +(subtotal*0.08).toFixed(2); const total = +(subtotal+shipping+tax).toFixed(2); return {count: it.reduce((s,x)=>s+x.qty,0), subtotal, shipping, tax, total}; }
  return { items, add, update, remove, clear, totals };
})();
