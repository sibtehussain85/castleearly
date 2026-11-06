// tiny CDP driver: node cdp.js <url> <script.js-to-run-steps>
const {spawn}=require('child_process');
const http=require('http');
async function launch(w=1300,h=1000){
  const p=spawn('google-chrome',['--headless=new','--no-sandbox','--disable-gpu','--remote-debugging-port=9333','--window-size='+w+','+h,'about:blank'],{stdio:'ignore'});
  for(let i=0;i<50;i++){await new Promise(r=>setTimeout(r,200));try{const j=await new Promise((res,rej)=>http.get('http://127.0.0.1:9333/json',r=>{let d='';r.on('data',x=>d+=x);r.on('end',()=>res(JSON.parse(d)))}).on('error',rej));const pg=j.find(x=>x.type==='page');if(pg)return {p,ws:pg.webSocketDebuggerUrl};}catch(e){}}
  throw new Error('no chrome');
}
async function connect(url){const ws=new WebSocket(url);await new Promise(r=>ws.onopen=r);let id=0;const pend={};const logs=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend[m.id]){pend[m.id](m);delete pend[m.id];}
  if(m.method==='Runtime.consoleAPICalled')logs.push(m.params.args.map(a=>a.value).join(' '));
  if(m.method==='Runtime.exceptionThrown')logs.push('EXC '+JSON.stringify(m.params.exceptionDetails.exception&&m.params.exceptionDetails.exception.description||m.params.exceptionDetails.text));};
 const send=(method,params={})=>new Promise(r=>{const i=++id;pend[i]=r;ws.send(JSON.stringify({id:i,method,params}));});
 const ev=async(expr)=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.result.exceptionDetails)return 'ERR '+JSON.stringify(r.result.exceptionDetails.exception&&r.result.exceptionDetails.exception.description);return r.result.result.value;};
 await send('Runtime.enable');await send('Page.enable');
 return {send,ev,logs,ws};}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
module.exports={launch,connect,sleep};
