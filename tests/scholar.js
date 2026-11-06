const {C,Chess,sfLines}=require('./coachtest');
(async()=>{
 for (const [line,you] of [['e2e4 e7e5 d1h5 b8c6 f1c4 g8f6 h5f7','b'],['e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 f6d5 g5f7','b'],['e2e4 e7e5 g1f3 d7d6 f1c4 c8g4 b1c3 g7g6 f3e5 g4d1 c4f7 e8e7 c3d5','w']]){
 const moves=line.split(' '); const c=new Chess(); const fens=[c.fen()];
 for(const m of moves){c.move(m);fens.push(c.fen());}
 const L=await sfLines(fens);
 for(let i=0;i<moves.length;i++){const side=fens[i].split(' ')[1];
   if(side===you){const g=C.grade(L[i],L[i+1],moves[i],false);
     const e=C.explainMove({fen:fens[i],uci:moves[i],after:fens[i+1],pre:L[i],post:L[i+1],g,book:null,bookHere:[],you,coach:you==='w'?'b':'w',name:'Test'});
     console.log('YOU',e.san,'['+g.cls+']',e.text);}
   else console.log('  COACH',C.explainCoach(fens[i],moves[i],null,you).san, C.explainCoach(fens[i],moves[i],null,you).text);}
 console.log('---');}
})();
