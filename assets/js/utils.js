window.Utils = (function(){
  const qs = (s, el=document) => el.querySelector(s);
  const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));
  const fmtCurrency = (n, c='USD') => new Intl.NumberFormat(undefined,{style:'currency',currency:c}).format(n);
  const getParam = (key) => new URLSearchParams(location.search).get(key);
  const setParam = (params) => {
    const usp = new URLSearchParams(location.search);
    Object.entries(params).forEach(([k,v])=>{ if(v===null||v===undefined||v==='') usp.delete(k); else usp.set(k,v); });
    history.replaceState({}, '', `${location.pathname}?${usp.toString()}`);
  };
  const debounce = (fn, t=250) => { let id; return (...a)=>{ clearTimeout(id); id=setTimeout(()=>fn(...a), t); } };
  return { qs, qsa, fmtCurrency, getParam, setParam, debounce };
})();
