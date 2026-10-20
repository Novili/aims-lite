(function(){
 'use strict';
 const key='novili-lite-theme',root=document.documentElement;
 const system=window.matchMedia?window.matchMedia('(prefers-color-scheme: dark)'):null;
 let mode='auto';
 try{const saved=localStorage.getItem(key);if(['day','night','auto'].includes(saved))mode=saved;}catch(e){}
 function apply(){
  const night=mode==='night'||mode==='auto'&&!!system?.matches;
  root.dataset.theme=night?'night':'day';root.style.colorScheme=night?'dark':'light';
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=night?'#101719':'#ffffff';
 }
 apply();
 if(system?.addEventListener)system.addEventListener('change',()=>{if(mode==='auto')apply();});
 else if(system?.addListener)system.addListener(()=>{if(mode==='auto')apply();});
 document.addEventListener('DOMContentLoaded',()=>{
  const select=document.getElementById('appearance');if(!select)return;select.value=mode;
  select.addEventListener('change',()=>{
   if(!['day','night','auto'].includes(select.value))return;mode=select.value;apply();
   try{localStorage.setItem(key,mode);}catch(e){const status=document.getElementById('status');if(status)status.textContent='Appearance changed for this session. This browser could not save the preference.';}
  });
 });
})();
