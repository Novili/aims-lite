const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const {voicePlate}=require('../entry-utils.js');
assert.equal(voicePlate('alpha bravo charlie one two three four'),'ABC1234');
assert.equal(voicePlate('A B C dash zero nine eight'),'ABC098');
const original=[{plate:'ABC123',state:'CA',lot:'Pacientes',locality:'Hospital',operator:'Ana',timestamp:'2026-10-19T12:00:00Z',extra:'preserve'}];
function boot(initial,blocked=false){const nodes=new Map(),store=new Map([['aims-lite-v1-history',initial]]);function el(id){if(!nodes.has(id))nodes.set(id,{value:({state:'CA',lot:'Pacientes',location:'Loma Linda',operator:'Ana',plate:'NEW123'})[id]||'',listeners:{},children:[],addEventListener(t,f){this.listeners[t]=f},replaceChildren(){this.children=[]},append(...x){this.children.push(...x)},focus(){},click(){},scrollIntoView(){}});return nodes.get(id)}
const context={console,Map,Set,Date,JSON,Number,String,Error,Promise,Blob,URL,setTimeout(){},clearTimeout(){},setInterval(){},confirm:()=>true,AimsEntry:require('../entry-utils.js'),AimsVisits:require('../visits.js'),navigator:{},localStorage:{getItem(k){if(blocked)throw Error('blocked');return store.get(k)??null},setItem(k,v){if(blocked)throw Error('blocked');store.set(k,v)}},document:{getElementById:el,createElement:()=>el('created'+Math.random()),querySelector:()=>el('submit'),addEventListener(){}},window:{addEventListener(){}}};vm.createContext(context);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../app.js'),'utf8'),context);return {el,store,run:s=>vm.runInContext(s,context)}}
let b=boot(JSON.stringify(original));assert.equal(b.store.get('aims-lite-v1-history'),JSON.stringify(original));
b.el('entry').listeners.submit({preventDefault(){}});assert.equal(JSON.parse(b.store.get('aims-lite-v1-history')).length,2);assert.equal(b.store.get('aims-lite-v1-history-backup-before-change'),JSON.stringify(original));assert.equal(JSON.parse(b.store.get('aims-lite-v1-history'))[0].extra,'preserve');
// A single delete removes only the selected record and updates counts.
b.el('history').children[0].children.at(-1).listeners.click();assert.equal(JSON.parse(b.store.get('aims-lite-v1-history')).length,1);assert.equal(JSON.parse(b.store.get('aims-lite-v1-history'))[0].plate,'ABC123');
b.store.set('aims-lite-v1-history','[]');assert.equal(b.run('persist([])'),false);
b=boot('{invalid');assert.equal(b.run('persist([])'),false);assert.equal(b.store.get('aims-lite-v1-history'),'{invalid');boot(null,true);
console.log('PASS: voice parsing, existing data, backup, save, individual delete, concurrent edit protection, corrupt and unavailable storage.');
