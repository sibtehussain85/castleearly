const {launch,connect,sleep}=require('./cdp');
const fs=require('fs');
(async()=>{
 const {p,ws}=await launch(412,900);
 const c=await connect(ws);
 try{
 await c.send('Emulation.setDeviceMetricsOverride',{width:412,height:900,deviceScaleFactor:1,mobile:true});
 // 1) Englund as White: fall into the trap with Bc3
 await c.send('Page.navigate',{url:'http://localhost:8765/openings/englund-gambit/'});
 await sleep(2500);
 await c.ev(`document.querySelector('.coach-start').click()`); await sleep(2500);
 await c.ev(`var s=document.querySelector('[data-co=color]'); s.value='w'; s.dispatchEvent(new Event('change',{bubbles:true}))`);
 const waitTurn=async()=>{for(let i=0;i<50;i++){const t=await c.ev(`document.querySelector('.co-board')._board.isHumanTurn()`);if(t===true)return;await sleep(300);}};
 const play=async(uci)=>c.ev(`(function(){var b=document.querySelector('.co-board')._board; var r=b.applyMove('${uci.slice(0,2)}','${uci.slice(2,4)}','',false); return r?r.san:'illegal '+b.game.fen();})()`);
 for(const m of ['d2d4','d4e5','g1f3','c1f4','f4d2','d2c3']){await waitTurn(); console.log('me',m,await play(m));}
 await sleep(3500);
 console.log('HIST', await c.ev(`document.querySelector('.co-board')._board.game.history().join(' ')`));
 console.log(await c.ev(`[].map.call(document.querySelectorAll('#coach-englund-gambit .co-it'),function(li){return li.innerText.replace(/\\n+/g,' | ')}).slice(0,4).join('\\n')`));
 await c.ev(`document.querySelector('.coach-card').scrollIntoView()`); await sleep(400);
 let shot=await c.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}); fs.writeFileSync('/tmp/m-coach.png',Buffer.from(shot.result.data,'base64'));
 await c.ev(`document.querySelector('.co-panel').scrollIntoView()`); await sleep(400);
 shot=await c.send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync('/tmp/m-coach2.png',Buffer.from(shot.result.data,'base64'));
 // 2) tactics: wrong move on the fork puzzle, then the right one
 await c.send('Page.navigate',{url:'http://localhost:8765/tactics/'}); await sleep(2500);
 const r=await c.ev(`(function(){var b=document.querySelector('#fork .playboard')._board; b.puzzleMove('b5','d6',''); return b.mistakes;})()`);
 console.log('mistakes',r); await sleep(5000);
 console.log('WRONG:',await c.ev(`document.querySelector('#fork .pz-coach').innerText`));
 await c.ev(`(function(){var b=document.querySelector('#fork .playboard')._board; b.puzzleMove('b5','c7','');})()`); await sleep(800);
 console.log('RIGHT:',await c.ev(`document.querySelector('#fork .pz-coach').innerText`));
 console.log('LOGS',c.logs.slice(0,10));
 } finally { p.kill(); }
})();
