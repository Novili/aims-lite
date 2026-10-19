(function(root){
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 const states={CALIFORNIA:'CA',NEVADA:'NV',OREGON:'OR',WASHINGTON:'WA',ARKANSAS:'AR'};
 const state=s=>states[norm(s)]||norm(s);
 const key=(plate,jurisdiction)=>norm(plate)+'|'+state(jurisdiction);
 function bounds(now){
  const week=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  week.setDate(week.getDate()-(week.getDay()+6)%7);
  const weekEnd=new Date(week);weekEnd.setDate(weekEnd.getDate()+7);
  return {week,weekEnd,month:new Date(now.getFullYear(),now.getMonth(),1),monthEnd:new Date(now.getFullYear(),now.getMonth()+1,1)};
 }
 function tally(rows,now=new Date()){
  const b=bounds(now),map=new Map();
  for(const r of rows){const k=key(r.plate,r.state),t=new Date(r.timestamp);let n=map.get(k);if(!n){n={week:0,month:0};map.set(k,n);}
   if(t>=b.week&&t<b.weekEnd&&t<=now)n.week++;
   if(t>=b.month&&t<b.monthEnd&&t<=now)n.month++;
  }return map;
 }
 function count(map,plate,jurisdiction){return map.get(key(plate,jurisdiction))||{week:0,month:0};}
 const text=n=>n.week+' registros esta semana · '+n.month+' este mes';
 root.AimsVisits={bounds,tally,count,text};if(typeof module!=='undefined')module.exports=root.AimsVisits;
})(typeof window==='undefined'?globalThis:window);
