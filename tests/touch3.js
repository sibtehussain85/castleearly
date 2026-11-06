const {launch,connect,sleep}=require('./cdp');
(async()=>{const {p,ws}=await launch(412,900);const c=await connect(ws);
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:900,deviceScaleFactor:1,mobile:true});
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await c.send('Page.navigate',{url:'http://localhost:8765/'});await sleep(3000);
 const sw=async(x,y)=>{await c.ev('scrollTo(0,0)');await sleep(200);
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let k=1;k<=15;k++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-k*15}]});await sleep(16);}
   await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(700);
   return [await c.ev('scrollY'), await c.ev(`document.querySelector('.playboard')._board.game.history().join(' ')||'-'`)];};
 const r=await c.ev(`(function(){var e=document.querySelector('.pb-board').getBoundingClientRect();return [e.x,e.y,e.width]})()`);
 const at=(f,rk)=>[Math.round(r[0]+r[2]*(f+.5)/8),Math.round(r[1]+r[2]*(7-rk+.5)/8)];
 console.log('control text:', await sw(200,120));
 console.log('empty d5:', await sw(...at(3,4)));
 console.log('black pawn d7:', await sw(...at(3,6)));
 console.log('own pawn d2:', await sw(...at(3,1)));
 await c.ev(`document.querySelector('.pb-lock').click()`);
 console.log('locked, empty d5:', await sw(...at(3,4)));
 await c.ev(`document.querySelector('.pb-lock').click()`);
}finally{p.kill();}})();
