const path='/home/claude/castleearly/assets/';
global.window={}; global.document={readyState:'complete',querySelectorAll:()=>[]};
global.localStorage={getItem:()=>null,setItem:()=>{}};
require(path+'engine.js');
if(!window.CEChess) window.CEChess=global.CEChess||module.exports.CEChess;
const Chess=window.CEChess||require(path+'engine.js');
window.CEChess=Chess;
function Board(){}; Board.prototype={puzzleMove(){},newGame(){}};
window.CEPlay={Board,sfUrl:''};
require(path+'coach.js');
const C=window.CECoach;
const {spawn}=require('child_process');
function sfLines(fens,ms=700){return new Promise(res=>{const p=spawn('node',[path+'stockfish/stockfish-19-lite-single.js']);let buf='',out=[],cur={},i=0,MATE=100000;
p.stdout.on('data',d=>{buf+=d;let k;while((k=buf.indexOf('\n'))>=0){const l=buf.slice(0,k);buf=buf.slice(k+1);
 if(l.startsWith('info ')&&l.includes(' pv ')&&!l.includes('bound')){const dep=+/ depth (\d+)/.exec(l)[1],mp=+(/ multipv (\d+)/.exec(l)||[0,1])[1];const cp=/ score cp (-?\d+)/.exec(l),mt=/ score mate (-?\d+)/.exec(l);const pv=l.slice(l.indexOf(' pv ')+4).trim().split(/\s+/);let s=cp?+cp[1]:(+mt[1]>0?MATE-(2*+mt[1]-1):-(MATE+2*+mt[1]));if(mt&&+mt[1]===0)s=-MATE;if(!cur[mp]||dep>=cur[mp].d)cur[mp]={d:dep,move:pv[0],score:s,pv};}
 if(l.startsWith('bestmove')){const a=Object.values(cur).sort((x,y)=>y.score-x.score);out.push(a);cur={};i++;if(i<fens.length)go();else{p.kill();res(out);}}
 if(l==='readyok')go();}});
 const go=()=>{p.stdin.write('position fen '+fens[i]+'\ngo depth 13\n');};
 p.stdin.write('uci\nsetoption name MultiPV value 4\nisready\n');});}
module.exports={C,Chess,sfLines};
