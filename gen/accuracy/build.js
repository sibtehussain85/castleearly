const fs=require('fs');const Chess=require('../../../castleearly/assets/engine.js');
const out=[];let bad=0;
for(const line of fs.readFileSync('raw.txt','utf8').trim().split('\n')){const [id,tc,w,b,aw,ab,res,mv]=line.split('|');const u=mv.trim().split(/\s+/);const c=new Chess();let ok=true;for(const x of u){if(!c.move(x)){ok=false;console.log('ILLEGAL',id,x);break;}}if(!ok){bad++;continue;}out.push({url:id,tc,w:+w,b:+b,aw:+aw,ab:+ab,res,u});}
// game 1 from tools repo (SAN)
const g1=JSON.parse(fs.readFileSync('/home/claude/toolsrepo/gen/accuracy/games.json','utf8'))[0];
const sans=g1.moves.replace(/\d+\./g,' ').replace(/1\/2-1\/2|1-0|0-1/,'').trim().split(/\s+/);const c=new Chess();const u=[];
for(const s of sans){const want=s.replace(/[+#]/g,'');const L=c.legalMoves();let hit=null;for(const m of L){if(c.san(m,L).replace(/[+#]/g,'')===want){hit=Chess.sqName(m.from)+Chess.sqName(m.to)+(m.promotion?m.promotion.toLowerCase():'');break;}}if(!hit){console.log('g1 fail',s);break;}c.move(hit);u.push(hit);}
out.push({url:'186136047748',tc:'rapid?',w:840,b:831,aw:74.54,ab:78.74,res:'1/2',u,ce:{w:67.5,b:84.7}});
fs.writeFileSync('games.json',JSON.stringify(out));console.log('games',out.length,'bad',bad,'plies',out.reduce((a,g)=>a+g.u.length+1,0));
