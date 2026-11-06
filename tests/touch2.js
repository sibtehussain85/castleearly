const {launch,connect,sleep}=require('./cdp');
(async()=>{const {p,ws}=await launch(412,900);const c=await connect(ws);
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:900,deviceScaleFactor:1,mobile:true});
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await c.send('Page.navigate',{url:'http://localhost:8765/'});await sleep(3000);
 const sg=async(x,y)=>{await c.ev('scrollTo(0,0)');await sleep(200);await c.send('Input.synthesizeScrollGesture',{x,y,yDistance:-300,gestureSourceType:'touch',speed:1200,repeatCount:1});await sleep(800);return c.ev('scrollY');};
 const r=await c.ev(`(function(){var e=document.querySelector('.pb-board').getBoundingClientRect();return [e.x,e.y,e.width]})()`);
 console.log('board rect',r);
 console.log('control (text above board):', await sg(200, 120));
 console.log('on empty square d5 (row 4):', await sg(Math.round(r[0]+r[2]*3.5/8), Math.round(r[1]+r[2]*3.5/8)));
 console.log('on own pawn d2:', await sg(Math.round(r[0]+r[2]*3.5/8), Math.round(r[1]+r[2]*6.5/8)));
 console.log('effective', await c.ev(`[getComputedStyle(document.querySelector('.pb-board')).touchAction, document.elementFromPoint(${Math.round(r[0]+r[2]*3.5/8)},${Math.round(r[1]+r[2]*3.5/8)}).className]`));
}finally{p.kill();}})();
