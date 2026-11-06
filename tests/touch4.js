const {launch,connect,sleep}=require('./cdp');
(async()=>{const {p,ws}=await launch(412,900);const c=await connect(ws);
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:900,deviceScaleFactor:1,mobile:true});
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await c.send('Page.navigate',{url:'http://localhost:8765/'});await sleep(3000);
 const r=await c.ev(`(function(){var e=document.querySelector('.pb-board').getBoundingClientRect();return [e.x,e.y,e.width]})()`);
 const at=(f,rk)=>[Math.round(r[0]+r[2]*(f+.5)/8),Math.round(r[1]+r[2]*(7-rk+.5)/8)];
 const [x0,y0]=at(3,1),[x1,y1]=at(3,3);
 await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:y0}]});
 for(let k=1;k<=10;k++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0,y:y0+(y1-y0)*k/10}]});await sleep(16);}
 await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(1500);
 console.log('drag d2-d4:', await c.ev(`document.querySelector('.playboard')._board.game.history().join(' ')`), 'scrollY', await c.ev('scrollY'));
}finally{p.kill();}})();
