const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {voicePlate}=require('../entry-utils.js');
assert.equal(voicePlate('alpha bravo charlie one two three four'),'ABC1234');
assert.equal(voicePlate('A B C dash zero nine eight'),'ABC098');
const original=[{plate:'ABC123',state:'CA',lot:'Pacientes',locality:'Hospital',operator:'Ana',timestamp:'2026-10-19T12:00:00Z',extra:'preserve'}];
function boot(initial,blocked=false,options={}){const nodes=new Map(),store=new Map([['aims-lite-v1-history',initial]]);function el(id){if(!nodes.has(id))nodes.set(id,{value:({state:'CA',lot:'Pacientes',location:'Loma Linda',operator:'ANA',plate:'NEW123'})[id]||'',listeners:{},children:[],addEventListener(t,f){const prev=this.listeners[t];this.listeners[t]=prev?e=>{prev(e);f(e)}:f},replaceChildren(){this.children=[]},append(...x){this.children.push(...x)},contains(){return false},remove(){},focus(){},click(){},scrollIntoView(){}});return nodes.get(id)}
const context={console,Map,Set,Date,JSON,Number,String,Error,Promise,Blob,URL,setTimeout(){},clearTimeout(){},setInterval(){},confirm:()=>true,AimsEntry:require('../entry-utils.js'),AimsVisits:require('../visits.js'),navigator:{},localStorage:{getItem(k){if(blocked)throw Error('blocked');return store.get(k)??null},setItem(k,v){if(blocked||options.failBackup&&k.endsWith('-backup-before-change'))throw Error('blocked');store.set(k,v)}},document:{getElementById:el,createElement:()=>el('created'+Math.random()),querySelector:()=>el('submit'),addEventListener(){}},window:{SpeechRecognition:options.SpeechRecognition,addEventListener(t,f){this[t]=f}}};vm.createContext(context);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8'),context);return {el,store,context,run:s=>vm.runInContext(s,context)}}
let b=boot(JSON.stringify(original));assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));
b.el('entry').listeners.submit({preventDefault(){}});assert.equal(JSON.parse(b.store.get('aims-lite-v1-history')).length,2);assert.equal(b.store.get('aims-lite-v1-history-backup-before-change'),JSON.stringify(original));assert.equal(JSON.parse(b.store.get('aims-lite-v1-history'))[0].extra,'preserve');
// A single delete removes only the selected record and updates counts.
b.el('history').children[0].children.at(-1).listeners.click();assert.equal(JSON.parse(b.store.get('aims-lite-v1-history')).length,1);assert.equal(JSON.parse(b.store.get('aims-lite-v1-history'))[0].plate,'ABC123');
b.store.set('aims-lite-v1-history','[]');assert.equal(b.run('persist([])'),false);
b=boot('{invalid');assert.equal(b.run('persist([])'),false);assert.equal(b.store.get('aims-lite-v1-history'),'{invalid');boot(null,true);
console.log('PASS: voice parsing, existing data, backup, save, individual delete, concurrent edit protection, corrupt and unavailable storage.');

b=boot(JSON.stringify(original),false,{failBackup:true});assert.equal(b.run('persist([])'),false);assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));
b=boot(JSON.stringify(original));b.run('busy=true');b.el('entry').listeners.submit({preventDefault(){}});assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));b.run('busy=false;voiceActive=true');b.el('entry').listeners.submit({preventDefault(){}});assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));
b=boot(JSON.stringify(original));b.context.window.storage({key:null});assert.equal(b.run('storageReady'),false);
b=boot(null,true);b.el('backup').listeners.click();assert.match(b.el('status').textContent,/Backup could not/);
boot(null,false,{SpeechRecognition:function(){throw Error('unsupported')}});
// Verify all shell assets referenced by the service worker exist.
const sw=fs.readFileSync(require('path').join(__dirname,'../sw.js'),'utf8');for(const [,asset] of sw.matchAll(/'\.\/([^']+)'/g)){assert.ok(fs.existsSync(require('path').join(__dirname,'..',asset.split('?')[0])),asset);}
console.log('PASS: failed backup blocks writes, recognition blocks submission, storage clear, backup errors, speech initialization failure, cached assets.');

const image=require('../ocr-image.js');for(const rect of image.regions){const result=image.prepare({width:1,height:1,data:new Uint8ClampedArray([255,255,255,255])},rect);assert.ok(Number.isFinite(result.width)&&result.width>0&&result.width<=1800);assert.equal(result.data.length,result.width*result.height*4);}
console.log('PASS: tiny OCR images do not create zero-size crops.');


assert.equal(voicePlate('alpha bravo charlie one two three four five six seven eight nine zero').length,12);
b=boot(JSON.stringify(original));b.el('operator').value='aB9x';b.el('operator').listeners.input();assert.equal(b.el('operator').value,'AB9');b.el('plate').value='1234567890123';b.el('entry').listeners.submit({preventDefault(){}});assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));
let live;function MockSpeech(){live=this;}b=boot(JSON.stringify(original),false,{SpeechRecognition:MockSpeech});assert.equal(live.interimResults,true);const partial=[{transcript:'alpha bravo one'}];partial.isFinal=false;live.onresult({results:[partial]});assert.equal(b.el('plate').value,'AB1');assert.match(b.el('status').textContent,/Listening:/);
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');assert.ok(html.indexOf('for="location"')<html.indexOf('for="lot"'));assert.ok(html.indexOf('for="operator"')<html.indexOf('for="location"'));assert.ok(html.indexOf('for="operator"')<html.indexOf('for="plate"'));assert.ok(html.indexOf('for="plate"')<html.indexOf('for="state"'));assert.match(html,/id="operator" maxlength="3"/);assert.match(html,/maxlength="12"/);console.log('PASS: compact field order, uppercase operator, 12-character limits and live voice results.');
