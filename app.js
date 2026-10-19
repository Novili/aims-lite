"use strict";
const $=id=>document.getElementById(id), KEY='aims-lite-v1-history';
let lot='Pacientes', history=[], storageReady=true;
function say(s){$('status').textContent=s;if($('scanStatus'))$('scanStatus').textContent=s;}
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw)||raw.some(r=>!r||typeof r.plate!=='string'||typeof r.state!=='string'||!['Pacientes','Doctores','Servicio'].includes(r.lot)||!Number.isFinite(Date.parse(r.timestamp))))throw Error();history=raw;}catch(e){storageReady=false;say('No se pudo leer el historial. No se sobrescribirá. Exporta lo disponible o borra el historial para reiniciar.');}
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));history=next;storageReady=true;render();return true;}catch(e){say('No se guardó: almacenamiento lleno o no disponible. Exporta tu historial.');return false;}}
function render(){const list=$('history');list.replaceChildren();$('count').textContent=history.length+' registros';$('export').disabled=!history.length;for(const r of history.slice().reverse()){const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('small'),time=document.createElement('small');title.textContent=r.plate;detail.textContent=(r.state||'Sin jurisdicción')+' · '+(r.locality||'Hospital')+' / '+r.lot+' · '+(r.operator||'Sin operador (V1)');time.textContent=new Date(r.timestamp).toLocaleString();li.append(title,detail,time);list.append(li);}if(!history.length){const li=document.createElement('li');li.textContent='Tu primer registro aparecerá aquí.';list.append(li);}}
document.querySelectorAll('[data-lot]').forEach(b=>b.addEventListener('click',()=>{lot=b.dataset.lot;document.querySelectorAll('[data-lot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('lotLabel').textContent=lot;$('saveLot').textContent=lot;}));
$('entry').addEventListener('submit',e=>{e.preventDefault();const plate=$('plate').value.trim().toUpperCase(),state=$('state').value.trim();if(!plate||!$('operator').value.trim()||!$('location').value.trim()){say('Completa placa, operador y localidad.');return;}if(!storageReady){say('El historial no se puede leer; bórralo explícitamente para reiniciar.');return;}if(persist([...history,{plate,state,locality:$('location').value.trim(),operator:$('operator').value.trim(),lot,timestamp:new Date().toISOString()}])){say('Guardado: '+plate+' · '+lot);$('plate').value='';photoCanvas=null;$('preview').hidden=true;$('photo').value='';$('ocr').disabled=!photoCanvas;$('plate').focus();}});
$('capture').addEventListener('click',()=>{if(!busy){lastPhoto=null;$('photo').value='';$('photo').click();}});
let photoCanvas=null,worker=null,busy=false,lastPhoto=null;
function controls(lock){busy=lock;document.querySelector('#entry button').disabled=lock;['photo','capture','prepare','entry'].forEach(id=>{if(id!=='entry')$(id).disabled=lock;});$('ocr').disabled=lock||!photoCanvas;}
async function getWorker(){
 if(worker)return worker;
 if(!window.Tesseract)throw Error('No se cargó Tesseract. Reconecta y recarga.');
 const base=new URL('./vendor/',location.href).href;
 worker=await Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base.slice(0,-1),workerBlobURL:false,cacheMethod:'none',logger:m=>{$('ocrInfo').textContent=m.status+' '+Math.round((m.progress||0)*100)+'%';if($('scanStatus'))$('scanStatus').textContent='Leyendo foto… '+Math.round((m.progress||0)*100)+'%. Espera el resultado aquí.';}});
 await worker.setParameters({tessedit_pageseg_mode:'11'});return worker;
}
async function receivePhoto(){
 const file=$('photo').files[0];if(!file||file===lastPhoto||busy)return;lastPhoto=file;
 say('Foto recibida. Preparando lectura automática…');$('plate').placeholder='Leyendo foto…';
 $('entry').scrollIntoView({behavior:'smooth',block:'start'});
 photoCanvas=null;$('ocr').disabled=true;$('preview').hidden=true;
 $('plate').value='';
 const url=URL.createObjectURL(file);controls(true);
 try{const img=new Image();img.src=url;await img.decode();
 const c=$('preview'),scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
 c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);photoCanvas=c;c.hidden=false;
 say('Foto recibida. Leyendo placa…');
 }catch(e){say('No se pudo abrir la imagen. Prueba una foto JPEG o introduce la placa manualmente.');}
 finally{URL.revokeObjectURL(url);controls(false);}
 if(photoCanvas)await recognizePhoto();
 else{$('plate').placeholder='Escribe la placa';lastPhoto=null;}
}
$('photo').addEventListener('change',receivePhoto);
$('photo').addEventListener('input',receivePhoto);
window.addEventListener('pageshow',receivePhoto);
window.addEventListener('focus',receivePhoto);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)receivePhoto();});
async function recognizePhoto(){
 if(busy||!photoCanvas)return;controls(true);$('plate').value='';
 let timer;
 try{const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Tiempo de OCR agotado. Prueba otra foto.')),90000);});
 const data=await Promise.race([(async()=>{
 const w=await getWorker();let best=null;
 // Try the whole image first. A real padded crop avoids rectangle artifacts.
 for(const region of [null,[0.1,0.25,0.8,0.5]]){
  const c=document.createElement('canvas'),ctx=c.getContext('2d');
  const [x,y,rw,rh]=region||[0,0,1,1];
  const width=photoCanvas.width*rw,height=photoCanvas.height*rh;
  const scale=Math.min(2,1800/width);c.width=Math.round(width*scale)+40;c.height=Math.round(height*scale)+40;
  ctx.fillStyle='white';ctx.fillRect(0,0,c.width,c.height);ctx.filter=region?'grayscale(1) contrast(1.4)':'none';
  ctx.drawImage(photoCanvas,photoCanvas.width*x,photoCanvas.height*y,width,height,20,20,c.width-40,c.height-40);
  const result=(await w.recognize(c)).data;const guess=AimsOCR.suggest(result.text);
  if(!best||(guess.plate&&!best.guess.plate)||(!!guess.plate===!!best.guess.plate&&result.confidence>best.confidence))best={...result,guess};
  if(guess.plate&&result.confidence>=75)break;
 }return best;
})(),timeout]);
 const suggestion=data.guess;$('plate').value=suggestion.plate;
 $('plate').dispatchEvent(new Event('input',{bubbles:true}));
 $('plate').placeholder='Escribe la placa';$('entry').scrollIntoView({behavior:'smooth',block:'start'});
 $('ocrInfo').textContent='Texto leído: '+data.text.slice(0,600)+' · Confianza OCR: '+Math.round(data.confidence||0)+'%';
 say(suggestion.plate?'Sugerencia editable. Revisa O/0, I/1, jurisdicción y lote antes de confirmar.':'Sin placa clara. Acerca la foto, vuelve a tomarla o escribe manualmente.');
 }catch(e){if(worker){worker.terminate();worker=null;}say('OCR falló: '+e.message+' Puedes registrar manualmente.');}
 finally{clearTimeout(timer);controls(false);$('plate').placeholder='ABC-1234';}
}
$('ocr').addEventListener('click',recognizePhoto);
$('prepare').addEventListener('click',async()=>{
 if(busy)return;controls(true);
 try{if(!navigator.serviceWorker)throw Error('Requiere HTTPS y Service Worker.');
 const reg=await navigator.serviceWorker.ready;
 await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(Error('Preparación agotada; vuelve a intentar con conexión.')),120000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();e.data.ok?resolve():reject(Error(e.data.error));};reg.active.postMessage({type:'PREPARE_OCR'},[channel.port2]);});
 await getWorker();$('offline').textContent='App y archivos OCR preparados sin conexión. Verifica en modo avión.';
 say('OCR preparado. iOS puede eliminar la caché; exporta tus registros.');
 }catch(e){say('No se confirmó OCR sin conexión: '+e.message);}
 finally{controls(false);}
});
$('ocrInfo').textContent='OCR en el dispositivo. Toca el recuadro. Al regresar de la cámara se leerá la foto; confirma para guardar.';
function csvCell(v){let s=String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function toCSV(rows){return '\uFEFF'+[['fecha_iso','fecha_local','localidad','lote','placa','estado','operador'],...rows.map(r=>[r.timestamp,new Date(r.timestamp).toLocaleString(),r.locality||'Hospital',r.lot,r.plate,r.state,r.operator||''])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([toCSV(history)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='AIMS-Lite-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);say('CSV generado. En iPhone usa Compartir / Guardar en Archivos si aparece una vista previa.');});
$('clear').addEventListener('click',()=>{if(confirm('¿Borrar todo el historial local? Exporta un CSV antes si deseas conservarlo.')){if(persist([]))say('Historial borrado.');}});
render();if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>$('offline').textContent='Formulario listo sin conexión. Pulsa Preparar OCR para incluir el motor.').catch(()=>$('offline').textContent='Caché no disponible. Usa HTTPS y vuelve a cargar.');}else $('offline').textContent='Modo sin conexión no disponible en este navegador';
