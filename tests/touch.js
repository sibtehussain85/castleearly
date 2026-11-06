const {launch,connect,sleep}=require('./cdp');const fs=require('fs');
(async()=>{const {p,ws}=await launch(412,900);const c=await connect(ws);
try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:900,deviceScaleFactor:1,mobile:true});
 await c.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await c.send('Emulation.setEmitTouchEventsForMouse',{enabled:true,configuration:'mobile'});
 await c.send('Page.navigate',{url:'http://localhost:8765/'});await sleep(3000);
 const sq=async(name)=>c.ev(`(function(){var b=document.querySelector('.playboard')._board;var i='abcdefgh'.indexOf('${name}'[0])+8*(+'${name}'[1]-1);var r=b.sqEls[i].getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,getComputedStyle(b.sqEls[i]).touchAction]})()`);
 console.log('e4 square', await sq('e4'), 'e2', await sq('e2'));
 console.log('touch bar:', await c.ev(`document.querySelector('.pb-touch')&&document.querySelector('.pb-touch').innerText`));
 const y0=await c.ev('scrollY');
 const [x,y]=await sq('d5');
 await c.send('Input.synthesizeScrollGesture',{x:Math.round(x),y:Math.round(y),yDistance:-300,gestureSourceType:'touch',speed:800});
 await sleep(600);
 console.log('scroll from empty square:', y0,'->',await c.ev('scrollY'), '| moves:', await c.ev(`document.querySelector('.playboard')._board.game.history().join(' ')`));
 await c.ev('scrollTo(0,0)'); await sleep(300);
 const tap=async(n)=>{const [x,y]=await sq(n);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await sleep(60);await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(250);};
 await tap('e2'); await tap('e4'); await sleep(1500);
 console.log('after tap e2,e4:', await c.ev(`document.querySelector('.playboard')._board.game.history().join(' ')`));
 // scroll gesture starting on own piece should NOT scroll
 const y1=await c.ev('scrollY'); const [px,py]=await sq('d2');
 await c.send('Input.synthesizeScrollGesture',{x:Math.round(px),y:Math.round(py),yDistance:-200,gestureSourceType:'touch',speed:800}); await sleep(600);
 console.log('swipe from own piece:', y1,'->',await c.ev('scrollY'));
 // lock
 await c.ev(`document.querySelector('.pb-lock').click()`); await sleep(200);
 const y2=await c.ev('scrollY'); const [ex,ey]=await sq('d5');
 await c.send('Input.synthesizeScrollGesture',{x:Math.round(ex),y:Math.round(ey),yDistance:-200,gestureSourceType:'touch',speed:800}); await sleep(600);
 console.log('locked swipe empty:', y2,'->',await c.ev('scrollY'), await c.ev(`document.querySelector('.pb-touch').innerText`));
 await c.ev(`document.querySelector('.pb-lock').click()`);
 // coach fullscreen
 await c.send('Page.navigate',{url:'http://localhost:8765/openings/italian-game/'});await sleep(2500);
 await c.ev(`document.querySelector('.coach-link a').scrollIntoView({block:'center'})`); await sleep(300);
 let s=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/t-link.png',Buffer.from(s.result.data,'base64'));
 await c.ev(`document.querySelector('.coach-start').click()`);await sleep(3000);
 await c.ev(`(function(){var b=document.querySelector('.co-board')._board;b.applyMove('e2','e4','',false);})()`);await sleep(3500);
 await c.ev(`document.querySelector('.co-board')._board.toggleFs(true)`);await sleep(800);
 s=await c.send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('/tmp/t-fs.png',Buffer.from(s.result.data,'base64'));
 await c.ev(`document.querySelector('.pb-fs-exit').click()`);await sleep(500);
 console.log('panel back home:', await c.ev(`!!document.querySelector('.co-grid > .co-panel')`), 'fs off:', await c.ev(`!document.querySelector('.pb-fs')`));
 console.log('LOGS',c.logs);
}finally{p.kill();}})();
