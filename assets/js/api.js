window.API = (function(){
  let _products, _categories;
  async function products(){
    if(_products) return _products;
    try{
      const res = await fetch('./data/products.json');
      if(!res.ok) throw new Error('Failed to load products.json: '+res.status);
      _products = await res.json();
    }catch(err){
      console.error('[API.products] Error loading products:', err);
      _products = [];
    }
    return _products;
  }
  async function categories(){
    if(_categories) return _categories;
    try{
      const res = await fetch('./data/categories.json');
      if(!res.ok) throw new Error('Failed to load categories.json: '+res.status);
      _categories = await res.json();
    }catch(err){
      console.error('[API.categories] Error loading categories:', err);
      _categories = [];
    }
    return _categories;
  }
  async function productById(id){
    const list = await products();
    const target = String(id||'').trim();
    const found = list.find(p=>String(p.id||'').trim() === target);
    return found;
  }
  return { products, categories, productById };
})();
