"use strict";
const $=id=>document.getElementById(id), KEY='aims-lite-v1-history';
let lot='Pacientes', history=[], storageReady=true;
function say(s){$('status').textContent=s;if($('scanStatus'))$('scanStatus').textContent=s;}
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw)||raw.some(r=>!r||typeof r.plate!=='string'||typeof r.state!=='string'||!['Pacientes','Doctores','Servicio'].includes(r.lot)||!Number.isFinite(Date.parse(r.timestamp))))throw Error();history=raw;}catch(e){storageReady=false;say('History could not be read and will not be overwritten. Export available records or explicitly clear history to start over.');}
function updateVisits(){if(!$('visitsPreview'))return;const plate=$('plate').value.trim();$('visitsPreview').textContent=plate?'Already recorded: '+AimsVisits.text(AimsVisits.count(AimsVisits.tally(history),plate,$('state').value)):'';}
$('plate').addEventListener('input',updateVisits);$('state').addEventListener('change',updateVisits);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();updateVisits();}});
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));history=next;storageReady=true;render();updateVisits();return true;}catch(e){say('Not saved: storage is full or unavailable. Export your history.');return false;}}
function render(){const totals=AimsVisits.tally(history);const list=$('history');list.replaceChildren();$('count').textContent=history.length+' records';$('export').disabled=!history.length;for(const r of history.slice().reverse()){const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('small'),time=document.createElement('small');title.textContent=r.plate;detail.textContent=(r.state||'Unknown state')+' · '+(r.locality||'Hospital')+' / '+lotNames[r.lot]+' · '+(r.operator||'No operator (V1)');time.textContent=new Date(r.timestamp).toLocaleString();const visits=document.createElement('small');visits.textContent=AimsVisits.text(AimsVisits.count(totals,r.plate,r.state));li.append(title,detail,time,visits);list.append(li);}if(!history.length){const li=document.createElement('li');li.textContent='Your first record will appear here.';list.append(li);}}
const lotNames={Pacientes:'Patients',Doctores:'Doctors',Servicio:'Service'};
$('lot').addEventListener('change',()=>{lot=$('lot').value;$('saveLot').textContent=lotNames[lot];});
$('entry').addEventListener('submit',e=>{e.preventDefault();const plate=$('plate').value.trim().toUpperCase(),state=$('state').value.trim();if(!plate||!$('operator').value.trim()||!$('location').value.trim()){say('Enter a plate, operator and location.');return;}if(!storageReady){say('History cannot be read. Explicitly clear it to start over.');return;}if(persist([...history,{plate,state,locality:$('location').value.trim(),operator:$('operator').value.trim(),lot,timestamp:new Date().toISOString()}])){say('Saved: '+plate+' · '+lotNames[lot]+' · '+AimsVisits.text(AimsVisits.count(AimsVisits.tally(history),plate,state)));$('plate').value='';updateVisits();photoCanvas=null;$('preview').hidden=true;$('photo').value='';$('plate').focus();}});
$('capture').addEventListener('click',()=>{if(!busy){lastPhoto=null;$('photo').value='';$('photo').click();}});
let photoCanvas=null,worker=null,busy=false,lastPhoto=null;
function controls(lock){busy=lock;document.querySelector('#entry button').disabled=lock;['photo','capture','prepare','entry'].forEach(id=>{if(id!=='entry')$(id).disabled=lock;});}
async function getWorker(){
 if(worker)return worker;
 if(!window.Tesseract)throw Error('Tesseract did not load. Reconnect and reload.');
 const base=new URL('./',location.href).href;
 worker=await Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base.slice(0,-1),workerBlobURL:false,cacheMethod:'none',logger:m=>{$('ocrInfo').textContent=m.status+' '+Math.round((m.progress||0)*100)+'%';if($('scanStatus'))$('scanStatus').textContent='Reading photo… '+Math.round((m.progress||0)*100)+'%. Wait here for the result.';}});
 await worker.setParameters({tessedit_pageseg_mode:'11'});return worker;
}
async function receivePhoto(){
 const file=$('photo').files[0];if(!file||file===lastPhoto||busy)return;lastPhoto=file;
 say('Photo received. Starting automatic recognition…');$('plate').placeholder='Reading photo…';
 $('entry').scrollIntoView({behavior:'smooth',block:'start'});
 photoCanvas=null;$('preview').hidden=true;
 $('plate').value='';updateVisits();
 const url=URL.createObjectURL(file);controls(true);
 try{const img=new Image();img.src=url;await img.decode();
 const c=$('preview'),scale=Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
 c.width=Math.round(img.naturalWidth*scale);c.height=Math.round(img.naturalHeight*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);photoCanvas=c;c.hidden=false;
 say('Photo received. Reading plate…');
 }catch(e){say('Could not open the image. Try a JPEG photo or enter the plate manually.');}
 finally{URL.revokeObjectURL(url);controls(false);}
 if(photoCanvas)await recognizePhoto();
 else{$('plate').placeholder='Enter plate';lastPhoto=null;}
}
$('photo').addEventListener('change',receivePhoto);
$('photo').addEventListener('input',receivePhoto);
window.addEventListener('pageshow',receivePhoto);
window.addEventListener('focus',receivePhoto);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)receivePhoto();});
async function recognizePhoto(){
 if(busy||!photoCanvas)return;controls(true);$('plate').value='';updateVisits();
 let timer;
 try{const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('OCR timed out. Try another photo.')),90000);});
 const data=await Promise.race([(async()=>{
 const w=await getWorker();
 const source=photoCanvas.getContext('2d').getImageData(0,0,photoCanvas.width,photoCanvas.height);
 return AimsImage.scan(source,async(image,pass)=>{
  await w.setParameters({tessedit_pageseg_mode:pass===0?'11':'7',tessedit_char_whitelist:pass===0?'':'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',user_defined_dpi:'300'});
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  c.getContext('2d').putImageData(new ImageData(image.data,image.width,image.height),0,0);
  say('Reading photo automatically: pass '+(pass+1)+' of '+AimsImage.regions.length+'…');
  return (await w.recognize(c)).data;
 },AimsOCR.suggest);
})(),timeout]);
 const suggestion=data.guess;$('plate').value=suggestion.plate;
 $('plate').dispatchEvent(new Event('input',{bubbles:true}));
 $('plate').placeholder='Enter plate';$('entry').scrollIntoView({behavior:'smooth',block:'start'});
 $('ocrInfo').textContent='Recognized text: '+data.text.slice(0,600)+' · OCR confidence: '+Math.round(data.confidence||0)+'%';
 say(suggestion.plate?(data.confidence<75?'Low confidence: check EVERY character. ':'')+'Editable suggestion. Check O/0, I/1, state and lot before saving.':'No clear plate found. Take a closer photo or enter the plate manually.');
 }catch(e){if(worker){worker.terminate();worker=null;}say('OCR failed: '+e.message+' You can enter a record manually.');}
 finally{clearTimeout(timer);controls(false);$('plate').placeholder='ABC-1234';}
}

$('prepare').addEventListener('click',async()=>{
 if(busy)return;controls(true);
 try{if(!navigator.serviceWorker)throw Error('HTTPS and Service Worker support are required.');
 const reg=await navigator.serviceWorker.ready;
 await new Promise((resolve,reject)=>{const channel=new MessageChannel();const timer=setTimeout(()=>reject(Error('Preparation timed out. Try again while online.')),120000);channel.port1.onmessage=e=>{clearTimeout(timer);channel.port1.close();e.data.ok?resolve():reject(Error(e.data.error));};reg.active.postMessage({type:'PREPARE_OCR'},[channel.port2]);});
 await getWorker();$('offline').textContent='App and OCR files are ready offline. Test in airplane mode.';
 say('OCR ready. iOS may remove cached files; export your records.');
 }catch(e){say('Offline OCR could not be confirmed: '+e.message);}
 finally{controls(false);}
});
$('ocrInfo').textContent='On-device OCR. Tap Take photo. Recognition starts when you return; review the plate before saving.';
function csvCell(v){let s=String(v);if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function toCSV(rows){return '\uFEFF'+[['timestamp_iso','local_time','location','lot','plate','state','operator'],...rows.map(r=>[r.timestamp,new Date(r.timestamp).toLocaleString(),r.locality||'Hospital',lotNames[r.lot],r.plate,r.state,r.operator||''])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
$('export').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([toCSV(history)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='AIMS-Lite-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);say('CSV created. On iPhone, use Share / Save to Files if a preview opens.');});
$('clear').addEventListener('click',()=>{if(confirm('Clear all local history? Export a CSV first if you want to keep your records.')){if(persist([]))say('History cleared.');}});
setInterval(()=>{render();updateVisits();},60000);render();if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>$('offline').textContent='Form ready offline. Use Prepare offline OCR in Settings to include the engine.').catch(()=>$('offline').textContent='Cache unavailable. Use HTTPS and reload.');}else $('offline').textContent='Offline mode is unavailable in this browser';
