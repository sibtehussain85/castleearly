const {launch,connect,sleep}=require('./cdp');
const fs=require('fs');
(async()=>{
 const {p,ws}=await launch();
 const c=await connect(ws);
 try{
 await c.send('Page.navigate',{url:'http://localhost:8765/openings/englund-gambit/'});
 await sleep(2500);
 console.log(await c.ev(`document.querySelector('.coach-start').click(); 'clicked'`));
 await sleep(3000);
 console.log('board?', await c.ev(`!!document.querySelector('.co-board.pb') + ' ' + document.querySelector('#coach-englund-gambit .co-list').innerText.slice(0,300)`));
 // learner = Black (default side). Wait for coach's first move (1.d4), then play the Englund
 const play=async(uci)=>c.ev(`(function(){var b=document.querySelector('.co-board')._board; if(!b.isHumanTurn()) return 'not my turn ('+b.game.fen()+')'; var r=b.applyMove('${uci.slice(0,2)}','${uci.slice(2,4)}','',false); return r?r.san:'illegal';})()`);
 const waitTurn=async()=>{for(let i=0;i<40;i++){const t=await c.ev(`document.querySelector('.co-board')._board.isHumanTurn()`);if(t===true)return;await sleep(300);}};
 for(const m of ['e7e5','b8c6','d8e7','e7b4','b4b2']){await waitTurn(); console.log('me',m,await play(m));}
 await waitTurn(); await sleep(2500);
 console.log('FEN', await c.ev(`document.querySelector('.co-board')._board.game.fen()`));
 console.log('HIST', await c.ev(`document.querySelector('.co-board')._board.game.history().join(' ')`));
 console.log('PANEL\n'+await c.ev(`[].map.call(document.querySelectorAll('#coach-englund-gambit .co-it'),function(li){return (li.hidden?'(hidden) ':'')+li.innerText.replace(/\\n+/g,' | ')}).reverse().join('\\n')`));
 await c.send('Emulation.setDeviceMetricsOverride',{width:1300,height:1400,deviceScaleFactor:1,mobile:false});
 await c.ev(`document.getElementById('coach').scrollIntoView()`); await sleep(500);
 const shot=await c.send('Page.captureScreenshot',{format:'png'}); fs.writeFileSync('/tmp/coach1.png',Buffer.from(shot.result.data,'base64'));
 console.log('LOGS',c.logs.slice(0,10));
 } finally { p.kill(); }
})();
