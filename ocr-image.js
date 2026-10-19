(function(root){
 // Shared pixel processing: identical in the browser and the regression tests.
 function prepare(source,rect){
  const [rx,ry,rw,rh]=rect,sw=source.width,sh=source.height;
  const left=Math.round(sw*rx),top=Math.round(sh*ry),cw=Math.round(sw*rw),ch=Math.round(sh*rh);
  const height=180,width=Math.max(1,Math.round(cw*height/ch)),pad=0;
  const gray=new Uint8Array(width*height),hist=new Uint32Array(256);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const sx=Math.min(sw-1,left+Math.floor((x+.5)*cw/width)),sy=Math.min(sh-1,top+Math.floor((y+.5)*ch/height));
   const i=(sy*sw+sx)*4,g=Math.round(.2126*source.data[i]+.7152*source.data[i+1]+.0722*source.data[i+2]);
   gray[y*width+x]=g;hist[g]++;
  }
  const limit=gray.length*.01;let low=0,high=255,sum=0;
  for(;low<255;low++){sum+=hist[low];if(sum>=limit)break;}sum=0;
  for(;high>low;high--){sum+=hist[high];if(sum>=limit)break;}
  const outWidth=width+pad*2,outHeight=height+pad*2,data=new Uint8ClampedArray(outWidth*outHeight*4);data.fill(255);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
   const g=Math.max(0,Math.min(255,Math.round((gray[y*width+x]-low)*255/Math.max(1,high-low)))),i=((y+pad)*outWidth+x+pad)*4;
   data[i]=data[i+1]=data[i+2]=g;
  }
  return {data,width:outWidth,height:outHeight};
 }
 const regions=[[0,0,1,1],[.15,.2,.7,.18],[.15,.32,.7,.18],[.15,.44,.7,.18],[.15,.56,.7,.18]];
 function rank(result){const n=result.guess.plate.length;return (n>=5&&n<=8?25:0)+(n>=3&&n<=10?10:-100)+(result.confidence||0);}
 async function scan(source,recognize,suggest){
  let best=null;
  for(let i=0;i<regions.length;i++){
   const result=await recognize(prepare(source,regions[i]),i);
   const item={...result,guess:suggest(result.text||'')};
   if(!best||rank(item)>rank(best))best=item;
   if(item.guess.plate.length>=5&&item.confidence>=85)break;
  }
  return best;
 }
 root.AimsImage={prepare,regions,scan,rank};if(typeof module!=='undefined')module.exports=root.AimsImage;
})(typeof window==='undefined'?globalThis:window);

