(function(root){
 const jurisdictions=['Arkansas','Oregon','Washington','California','Florida','Texas','New York','New Jersey','Arizona','Nevada','Puerto Rico','Ontario','Quebec','Jalisco','Nuevo Leon','Chihuahua','Sonora','Baja California','Ciudad de Mexico','Estado de Mexico'];
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
 function suggest(text){
  let cleaned=normalize(text),state='';
  for(const name of [...jurisdictions].sort((a,b)=>b.length-a.length)){
   const re=new RegExp('\\b'+normalize(name).replace(/ /g,'\\s+')+'\\b','g');
   if(re.test(cleaned)){if(!state)state=name;cleaned=cleaned.replace(re,' ');}
  }
  const candidates=cleaned.split(/\n/).flatMap(line=>line.match(/[A-Z0-9][A-Z0-9 -]{2,18}[A-Z0-9]/g)||[])
   .map(x=>x.replace(/[^A-Z0-9]/g,'')).filter(x=>x.length>=3&&x.length<=10&&/\d/.test(x))
   .sort((a,b)=>(Number(/[A-Z]/.test(b))-Number(/[A-Z]/.test(a)))||Math.abs(a.length-7)-Math.abs(b.length-7));
  return {plate:candidates[0]||'',state};
 }
 root.AimsOCR={suggest};if(typeof module!=='undefined')module.exports=root.AimsOCR;
})(typeof window==='undefined'?globalThis:window);
