const {C,Chess,sfLines}=require('./coachtest');
const fs=require('fs');
(async()=>{
 // game: learner = White falls into the Englund trap; coach = Black
 const moves='d2d4 e7e5 d4e5 b8c6 g1f3 d8e7 c1f4 e7b4 f4d2 b4b2 d2c3 f8b4 d1d2 b4c3 d2c3 b2c1'.split(' ');
 const c=new Chess(); const fens=[c.fen()];
 for(const m of moves){c.move(m);fens.push(c.fen());}
 const L=await sfLines(fens);
 const book=new C.Book({lines:[{side:'b',moves:[]}]});
 for(let i=0;i<moves.length;i++){
   const you=i%2===0?'w':'b';
   if(you==='w'){
     const g=C.grade(L[i],L[i+1],moves[i],false);
     const e=C.explainMove({fen:fens[i],uci:moves[i],after:fens[i+1],pre:L[i],post:L[i+1],g,book:null,bookHere:[],you:'w',coach:'b',name:'Englund Gambit'});
     console.log('YOU',e.san,'['+g.cls+' drop '+g.drop.toFixed(1)+']',e.text);
   } else {
     const e=C.explainCoach(fens[i],moves[i],null,'w');
     console.log('COACH',e.san,'-',e.text);
   }
 }
})();
