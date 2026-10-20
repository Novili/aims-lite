"use strict";
const $=id=>document.getElementById(id), KEY='aims-lite-v1-history';
let lot='Pacientes', history=[], storageReady=true;
function say(s){$('status').textContent=s;if($('scanStatus'))$('scanStatus').textContent=s;}
try{const raw=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(raw)||raw.some(r=>!r||typeof r.plate!=='string'||typeof r.state!=='string'||!['Pacientes','Doctores','Servicio'].includes(r.lot)||!Number.isFinite(Date.parse(r.timestamp))))throw Error();history=raw;}catch(e){storageReady=false;say('History could not be read and will not be overwritten. Download a JSON backup to recover the original data.');}
let loadedRaw=null;try{loadedRaw=localStorage.getItem(KEY);}catch(e){storageReady=false;}
function updateVisits(){if(!$('visitsPreview'))return;const plate=$('plate').value.trim();$('visitsPreview').textContent=plate?'Already recorded: '+AimsVisits.text(AimsVisits.count(AimsVisits.tally(history),plate,$('state').value)):'';}
$('plate').addEventListener('input',updateVisits);$('state').addEventListener('change',updateVisits);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){render();updateVisits();}});
function persist(next){try{if(!storageReady){say('History is unavailable or changed. Download a backup and reload before saving.');return false;}const current=localStorage.getItem(KEY);if(current!==loadedRaw){say('History changed in another tab. Reload before saving.');return false;}if(current!==null)localStorage.setItem(KEY+'-backup-before-change',current);localStorage.setItem(KEY,JSON.stringify(next));loadedRaw=localStorage.getItem(KEY);history=next;storageReady=true;render();updateVisits();return true;}catch(e){say('Not saved: storage is full or unavailable. Export your history.');return false;}}
function render(){const totals=AimsVisits.tally(history);const list=$('history');list.replaceChildren();$('count').textContent=history.length+' records';$('export').disabled=!history.length;updateSuggestions();for(const r of history.slice().reverse()){const li=document.createElement('li'),title=document.createElement('strong'),detail=document.createElement('small'),time=document.createElement('small');title.textContent=r.plate;detail.textContent=(r.state||'Unknown state')+' · '+(r.locality||'Hospital')+' / '+lotNames[r.lot]+' · '+(r.operator||'No operator (V1)');time.textContent=new Date(r.timestamp).toLocaleString();const visits=document.createElement('small');visits.textContent=AimsVisits.text(AimsVisits.count(totals,r.plate,r.state));const del=document.createElement('button');del.type='button';del.className='danger';del.textContent='Delete record';del.addEventListener('click',()=>{if(confirm('Delete only '+r.plate+' ('+r.state+') recorded '+new Date(r.timestamp).toLocaleString()+'? A local backup is kept.')){const index=history.indexOf(r);if(index>=0&&persist(history.filter((_,i)=>i!==index)))say('Record deleted.');}});li.append(title,detail,time,visits,del);list.append(li);}if(!history.length){const li=document.createElement('li');li.textContent='Your first record will appear here.';list.append(li);}}
const lotNames={Pacientes:'Patients',Doctores:'Doctors',Servicio:'Service'};
$('lot').addEventListener('change',()=>{lot=$('lot').value;$('saveLot').textContent=lotNames[lot];});
$('entry').addEventListener('submit',e=>{e.preventDefault();if(busy||voiceActive){say('Wait for recognition to finish before saving.');return;}const plate=$('plate').value.trim().toUpperCase(),state=$('state').value.trim();if(!plate||!$('state').value||!lotNames[lot]||!$('operator').value.trim()||!$('location').value.trim()){say('Enter a plate, operator and location.');return;}if(!storageReady){say('History cannot be read. Download a JSON backup before attempting recovery.');return;}savePreferences();if(persist([...history,{plate,state,locality:$('location').value.trim(),operator:$('operator').value.trim(),lot,timestamp:new Date().toISOString()}])){say('Saved: '+plate+' · '+lotNames[lot]+' · '+AimsVisits.text(AimsVisits.count(AimsVisits.tally(history),plate,state)));$('plate').value='';updateVisits();photoCanvas=null;$('preview').hidden=true;$('photo').value='';$('plate').focus();}});
$('capture').addEventListener('click',()=>{if(!busy){lastPhoto=null;$('photo').value='';$('photo').click();}});
let photoCanvas=null,worker=null,busy=false,lastPhoto=null,voiceActive=false,ocrGeneration=0;
function controls(lock){busy=lock;$('voice').disabled=lock||!Speech;['plate','state','location','operator','lot'].forEach(id=>$(id).disabled=lock);document.querySelector('#entry button[type=submit]').disabled=lock;['photo','capture','prepare','entry'].forEach(id=>{if(id!=='entry')$(id).disabled=lock;});}
async function getWorker(generation=ocrGeneration){
 if(worker)return worker;
 if(!window.Tesseract)throw Error('Tesseract did not load. Reconnect and reload.');
 const base=new URL('./',location.href).href;
 const created=await Tesseract.createWorker('eng',1,{workerPath:base+'worker.min.js',corePath:base,langPath:base.slice(0,-1),workerBlobURL:false,cacheMethod:'none',logger:m=>{if(generation!==ocrGeneration)return;$('ocrInfo').textContent=m.status+' '+Math.round((m.progress||0)*100)+'%';if($('scanStatus'))$('scanStatus').textContent='Reading photo… '+Math.round((m.progress||0)*100)+'%. Wait here for the result.';}});
 try{await created.setParameters({tessedit_pageseg_mode:'11'});if(generation!==ocrGeneration)throw Error('OCR cancelled');worker=created;return worker;}catch(e){await created.terminate();throw e;}
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
 let timer;const generation=++ocrGeneration;
 try{const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{ocrGeneration++;reject(Error('OCR timed out. Try another photo.'));},90000);});
 const data=await Promise.race([(async()=>{
 const w=await getWorker(generation);
 if(generation!==ocrGeneration){await w.terminate();if(worker===w)worker=null;throw Error('OCR cancelled');}
 const source=photoCanvas.getContext('2d').getImageData(0,0,photoCanvas.width,photoCanvas.height);
 return AimsImage.scan(source,async(image,pass)=>{
  if(generation!==ocrGeneration)throw Error('OCR cancelled');
  await w.setParameters({tessedit_pageseg_mode:pass===0?'11':'7',tessedit_char_whitelist:pass===0?'':'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',user_defined_dpi:'300'});
  const c=document.createElement('canvas');c.width=image.width;c.height=image.height;
  c.getContext('2d').putImageData(new ImageData(image.data,image.width,image.height),0,0);
  if(generation!==ocrGeneration)throw Error('OCR cancelled');
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
$('clear').addEventListener('click',()=>{if(storageReady&&confirm('Clear ALL local records? Download a backup first. A local backup is also kept.')){if(persist([]))say('History cleared.');}});
setInterval(()=>{if(!$('history').contains(document.activeElement))render();updateVisits();},60000);render();if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(()=>navigator.serviceWorker.ready).then(()=>$('offline').textContent='Form ready offline. Use Prepare offline OCR in Settings to include the engine.').catch(()=>$('offline').textContent='Cache unavailable. Use HTTPS and reload.');}else $('offline').textContent='Offline mode is unavailable in this browser';

function updateSuggestions(){const list=$('plateSuggestions');list.replaceChildren();const seen=new Set();for(const r of history.slice().reverse()){if(r.state!==$('state').value||seen.has(r.plate))continue;seen.add(r.plate);const o=document.createElement('option');o.value=r.plate;list.append(o);if(seen.size>=100)break;}}
function savePreferences(){try{localStorage.setItem('aims-lite-preferences',JSON.stringify({operator:$('operator').value,city:$('location').value,state:$('state').value,lot}));}catch(e){say('Preferences could not be saved.');}}
try{const pref=JSON.parse(localStorage.getItem('aims-lite-preferences')||'{}');for(const [id,key] of [['operator','operator'],['location','city'],['state','state'],['lot','lot']]){if(typeof pref[key]==='string')$(id).value=pref[key];}if(!$('state').value)$('state').value='CA';if(!$('lot').value)$('lot').value='Pacientes';lot=$('lot').value;$('saveLot').textContent=lotNames[lot];}catch(e){say('Saved preferences could not be read; history is unchanged.');}
for(const id of ['operator','location','state','lot'])$(id).addEventListener('change',savePreferences);
$('state').addEventListener('change',updateSuggestions);
function downloadJSONBackup(){try{const snapshot={version:'2.6.1',createdAt:new Date().toISOString(),historyRaw:localStorage.getItem(KEY),previousHistoryRaw:localStorage.getItem(KEY+'-backup-before-change'),preferencesRaw:localStorage.getItem('aims-lite-preferences')};const url=URL.createObjectURL(new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='AIMS-Lite-backup-'+Date.now()+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);say('Backup download requested. Check that the file was saved.');}catch(e){say('Backup could not be downloaded: storage is unavailable. No records were changed.');}}
$('backup').addEventListener('click',downloadJSONBackup);
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
if(!Speech){$('voice').disabled=true;$('voice').textContent='Voice unavailable — type the plate';}else{try{const recognition=new Speech();recognition.lang='en-US';recognition.continuous=false;recognition.interimResults=false;let listening=false;recognition.onstart=()=>{listening=true;voiceActive=true;$('capture').disabled=true;$('prepare').disabled=true;$('voice').textContent='Stop dictation';say('Listening in American English. Say letters and digits.');};recognition.onend=()=>{listening=false;voiceActive=false;$('capture').disabled=busy;$('prepare').disabled=busy;$('voice').textContent='Dictate plate · English (US)';};recognition.onerror=e=>say('Voice unavailable: '+e.error+'. Type the plate manually.');recognition.onresult=e=>{if(busy)return;const spoken=e.results[0][0].transcript;$('plate').value=AimsEntry.voicePlate(spoken);updateVisits();say('Voice suggestion: '+spoken+'. Review every character before saving.');};$('voice').addEventListener('click',()=>{try{if(busy)return;listening?recognition.stop():recognition.start();}catch(e){say('Could not start dictation. Try again or type the plate.');}});}catch(e){$('voice').disabled=true;$('voice').textContent='Voice unavailable — type the plate';}}
window.addEventListener('storage',e=>{if(e.key===KEY||e.key===null){storageReady=false;say('History changed in another tab. Reload to use the latest records.');}});
updateSuggestions();updateVisits();
if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('controllerchange',()=>{$('offline').textContent='An app update is ready. Finish your entry, then reload to use the latest version.';});}
