(function(root){
 const digits={zero:'0',oh:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9'};
 const nato='alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu'.split(' ');
 function voicePlate(text){return String(text).toLowerCase().replace(/x-ray/g,'xray').split(/[\s,.-]+/).map(w=>digits[w]??(nato.includes(w)?String.fromCharCode(65+nato.indexOf(w)):['space','dash','hyphen'].includes(w)?'':w)).join('').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,20);}
 root.AimsEntry={voicePlate};if(typeof module!=='undefined')module.exports=root.AimsEntry;
})(typeof window==='undefined'?globalThis:window);
