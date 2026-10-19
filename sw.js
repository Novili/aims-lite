const CACHE='aims-lite-v2-1', OCR=CACHE+'-ocr';
const FILES=['./','./index.html','./styles.css','./app.js','./ocr-utils.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vendor/tesseract.min.js'];
const ENGINE=['worker.min.js','tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','eng.traineddata.gz'].map(x=>'./vendor/'+x);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('aims-lite-')&&![CACHE,OCR].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('message',e=>{if(e.data?.type==='PREPARE_OCR')e.waitUntil((async()=>{try{const c=await caches.open(OCR);await c.addAll(ENGINE);e.ports[0].postMessage({ok:true});}catch(err){e.ports[0].postMessage({ok:false,error:'Descarga incompleta. Reintenta con internet: '+err.message});}})());});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith((async()=>{const c=await caches.open(CACHE),o=await caches.open(OCR);return await c.match(e.request)||await o.match(e.request)||fetch(e.request).catch(err=>{if(e.request.mode==='navigate')return c.match('./index.html');throw err;});})());});
