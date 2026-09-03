const S=(shape,tone="violet",rotation=0)=>({kind:"shape",shape,tone,rotation});
const T=(text,sub="")=>({kind:"text",text:String(text),sub});
const TOKENS=[
  S("circle","peach"),S("square","violet"),S("diamond","yellow"),
  S("ring","mint"),S("triangle","blue"),S("cross","rose")
];

function localDateKey(){
  const d=new Date();
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");
}
function seedFromString(str){
  let h=2166136261;
  for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}
  return h>>>0;
}
function mulberry32(seed){
  return function(){
    let t=seed+=0x6D2B79F5;
    t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
function shuffleCopy(items,rand=Math.random){
  const out=[...items];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
}
function answerPack(correctItem,distractors,rand){
  const packed=shuffleCopy([{item:correctItem,correct:true},...distractors.map(item=>({item,correct:false}))],rand);
  return {answers:packed.map(x=>x.item),correct:packed.findIndex(x=>x.correct)};
}
function pickDistinct(rand,count,pool=TOKENS){return shuffleCopy(pool,rand).slice(0,count)}

function makeSequence(rand,category="PATTERN"){
  const [a,b,...rest]=pickDistinct(rand,5);
  const pack=answerPack(b,rest.slice(0,3),rand);
  return {type:"sequence",category,prompt:"Think carefully",title:"What comes next?",hint:"Find the hidden rule in the sequence.",
    board:[a,b,a,b,a,null],...pack,explanation:"The sequence alternates between two shapes."};
}
function makeMatrix(rand,final=false){
  const [a,b,c,...rest]=pickDistinct(rand,6);
  const pack=answerPack(b,[c,a,...rest].slice(0,3),rand);
  return {type:"matrix",category:final?"FINAL":"LOGIC",prompt:final?"Final challenge":"Find the rule",
    title:final?"Unlock the last tile":"Complete the matrix",
    hint:"Every row and column follows the same rule.",
    board:[a,b,c,b,c,a,c,a,null],...pack,
    explanation:"Each row uses the same three shapes, shifted one place."};
}
function makeOdd(rand){
  const base=[0,90,180,270][Math.floor(rand()*4)], odd=(base+90)%360, oddIndex=Math.floor(rand()*4);
  const tone=["mint","blue","violet","peach"][Math.floor(rand()*4)];
  const board=[0,1,2,3].map((_,i)=>S("arrow",tone,i===oddIndex?odd:base));
  return {type:"odd",category:"FOCUS",prompt:"Spot the difference",title:"Which one is different?",
    hint:"Three arrows point the same way.",board,
    answers:[T("1","TOP LEFT"),T("2","TOP RIGHT"),T("3","BOTTOM LEFT"),T("4","BOTTOM RIGHT")],
    correct:oddIndex,explanation:`Tile ${oddIndex+1} is the only arrow facing a different direction.`};
}
function makeMemory(rand){
  const target=Math.floor(rand()*9);
  const safePool=[S("circle","peach"),S("ring","mint"),S("square","blue"),S("triangle","violet"),S("circle","mint"),S("square","peach"),S("ring","blue"),S("triangle","rose")];
  const board=Array.from({length:9},()=>safePool[Math.floor(rand()*safePool.length)]);
  board[target]=S("diamond","yellow");
  const choices=new Set([target+1]);
  while(choices.size<4) choices.add(Math.floor(rand()*9)+1);
  const shuffled=shuffleCopy([...choices],rand);
  return {type:"memory",category:"MEMORY",prompt:"Memorize",title:"Remember the board",
    hint:"You have a moment. Where is the yellow diamond?",board,
    answers:shuffled.map(n=>T(n,"POSITION")),correct:shuffled.indexOf(target+1),
    explanation:`The yellow diamond was in position ${target+1}.`,revealAfter:2600};
}
function makeRotation(rand){
  const start=[0,90,180,270][Math.floor(rand()*4)];
  const tone=["blue","mint","violet"][Math.floor(rand()*3)];
  const angles=[0,1,2,3,4].map(i=>(start+i*90)%360);
  const correctRotation=(start+5*90)%360;
  const choices=shuffleCopy([0,90,180,270],rand);
  return {type:"sequence",category:"SPATIAL",prompt:"Rotate it",title:"Which direction is next?",
    hint:"The arrow turns the same amount each step.",
    board:[...angles.map(a=>S("arrow",tone,a)),null],
    answers:choices.map(a=>S("arrow",tone,a)),correct:choices.indexOf(correctRotation),
    explanation:"The arrow rotates 90° clockwise on every step."};
}
function makeEquation(rand){
  const diamond=3+Math.floor(rand()*5);
  let circle=1+Math.floor(rand()*6); if(circle===diamond) circle=(circle%6)+1;
  const alternatives=shuffleCopy([1,2,3,4,5,6,7,8,9].filter(n=>n!==circle),rand).slice(0,3);
  const choices=shuffleCopy([circle,...alternatives],rand);
  return {type:"equations",category:"LOGIC",prompt:"Decode the values",title:"What is the circle worth?",
    hint:"Use the first two clues.",
    board:[
      {left:S("diamond","yellow"),op:"+",right:S("diamond","yellow"),value:String(diamond*2)},
      {left:S("diamond","yellow"),op:"+",right:S("circle","peach"),value:String(diamond+circle)},
      {left:S("circle","peach"),op:"=",right:null,value:"?"}
    ],
    answers:choices.map(n=>T(n)),correct:choices.indexOf(circle),
    explanation:`A diamond is ${diamond}, so the circle must be ${circle}.`};
}
function makeDailyRun(key=localDateKey()){
  const rand=mulberry32(seedFromString(key));
  return [makeSequence(rand),makeMatrix(rand),makeOdd(rand),makeMemory(rand),makeRotation(rand),makeEquation(rand),makeMatrix(rand,true)];
}
function makePracticeRun(skill="Mixed"){
  const rand=Math.random;
  if(skill==="Pattern") return [makeSequence(rand),makeMatrix(rand),makeSequence(rand),makeMatrix(rand,true)];
  if(skill==="Focus") return [makeOdd(rand),makeMemory(rand),makeOdd(rand),makeMemory(rand)];
  if(skill==="Spatial") return [makeRotation(rand),makeRotation(rand),makeSequence(rand,"SPATIAL"),makeRotation(rand)];
  if(skill==="Logic") return [makeEquation(rand),makeMatrix(rand),makeEquation(rand),makeMatrix(rand)];
  return [makeSequence(rand),makeOdd(rand),makeMemory(rand),makeEquation(rand)];
}

const state={index:0,correct:0,answered:false,timeLeft:20,timer:null,memoryTimeout:null,responseTimes:[],categoryResults:{},questionStartedAt:0,run:[],mode:"daily",skill:""};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const screens={home:$("#homeScreen"),game:$("#gameScreen"),result:$("#resultScreen")};

function showScreen(name){
  Object.values(screens).forEach(screen=>screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  $("#bottomNav").style.display=name==="home"?"flex":"none";
  window.scrollTo({top:0,behavior:"smooth"});
}
function shapeMarkup(item){
  if(!item)return '<span aria-hidden="true">?</span>';
  if(item.kind==="text")return `<span class="answer-text">${item.text}${item.sub?`<small class="answer-sub">${item.sub}</small>`:""}</span>`;
  return `<span class="shape ${item.shape} tone-${item.tone}" style="--rotation:${item.rotation||0}deg" aria-hidden="true"></span>`;
}
function tileMarkup(item,index,numbered=false){
  return `<div class="tile ${!item?"question":""}">${numbered?`<span class="tile-number">${index+1}</span>`:""}${shapeMarkup(item)}</div>`;
}
function renderBoard(p){
  const board=$("#puzzleBoard");board.className=`puzzle-board ${p.type}`;
  if(p.type==="equations"){
    board.innerHTML=p.board.map(row=>`<div class="equation"><span class="mini-shape">${shapeMarkup(row.left)}</span><span class="equation-symbol">${row.op}</span>${row.right?`<span class="mini-shape">${shapeMarkup(row.right)}</span><span class="equation-symbol">=</span>`:""}<span class="equation-value">${row.value}</span></div>`).join("");return;
  }
  if(p.type==="odd"){
    board.innerHTML=p.board.map((item,i)=>`<div class="odd-card"><b>${i+1}</b>${shapeMarkup(item)}</div>`).join("");return;
  }
  board.innerHTML=p.board.map((item,i)=>tileMarkup(item,i,p.type==="memory")).join("");
}
function renderAnswers(p){
  const answers=$("#answersGrid");answers.className="answers-grid";
  answers.innerHTML=p.answers.map((answer,i)=>`<button class="answer-button" data-answer="${i}" aria-label="Answer ${i+1}">${shapeMarkup(answer)}</button>`).join("");
  $$(".answer-button").forEach(btn=>btn.addEventListener("click",()=>chooseAnswer(Number(btn.dataset.answer))));
}
function resetRun(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);state.index=0;state.correct=0;state.answered=false;state.responseTimes=[];state.categoryResults={};
}
function startRun(){
  resetRun();state.mode="daily";state.skill="";state.run=makeDailyRun();showScreen("game");renderPuzzle();
}
function startPractice(skill="Mixed"){
  resetRun();state.mode="practice";state.skill=skill;state.run=makePracticeRun(skill);showScreen("game");renderPuzzle();
}
function startTimer(){
  clearInterval(state.timer);state.timeLeft=20;state.questionStartedAt=Date.now();$("#timerText").textContent=state.timeLeft;
  state.timer=setInterval(()=>{if(state.answered)return;state.timeLeft-=1;$("#timerText").textContent=Math.max(0,state.timeLeft);if(state.timeLeft<=0){clearInterval(state.timer);chooseAnswer(-1)}},1000);
}
function renderPuzzle(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);state.answered=false;
  const p=state.run[state.index];
  $("#questionCounter").textContent=`${state.index+1} of ${state.run.length}`;
  $("#gameCategory").textContent=p.category;$("#stageChip").textContent=p.category;
  $("#modePrompt").innerHTML=`<span></span> ${p.prompt}`;$("#questionTitle").textContent=p.title;$("#questionHint").textContent=p.hint;
  $("#progressBar").style.width=`${((state.index+1)/state.run.length)*100}%`;
  $("#feedbackCard").classList.remove("show","bad");$("#memoryCurtain").classList.remove("show");
  $("#answerLabel").textContent=p.type==="memory"?"MEMORIZE FIRST":"CHOOSE YOUR ANSWER";
  renderBoard(p);renderAnswers(p);
  if(p.type==="memory"){
    $("#answersGrid").classList.add("waiting");$("#timerText").textContent="—";
    state.memoryTimeout=setTimeout(()=>{
      $("#memoryCurtain").classList.add("show");
      setTimeout(()=>{
        $("#puzzleBoard").innerHTML=p.board.map((_,i)=>`<div class="tile"><span class="answer-text">${i+1}</span></div>`).join("");
        $("#memoryCurtain").classList.remove("show");$("#questionTitle").textContent="Where was the diamond?";
        $("#questionHint").textContent="Choose the position that held the yellow diamond.";$("#answerLabel").textContent="CHOOSE THE POSITION";
        $("#answersGrid").classList.remove("waiting");startTimer();
      },420);
    },p.revealAfter);
  }else startTimer();
}
function chooseAnswer(index){
  if(state.answered||$("#answersGrid").classList.contains("waiting"))return;
  state.answered=true;clearInterval(state.timer);clearTimeout(state.memoryTimeout);
  const p=state.run[state.index],buttons=$$(".answer-button"),isCorrect=index===p.correct;
  if(index>=0&&buttons[index])buttons[index].classList.add(isCorrect?"correct":"wrong");
  if(!isCorrect&&buttons[p.correct])buttons[p.correct].classList.add("correct");
  const seconds=Math.max(0,Math.min(20,(Date.now()-state.questionStartedAt)/1000));state.responseTimes.push(seconds);
  if(!state.categoryResults[p.category])state.categoryResults[p.category]={correct:0,total:0};state.categoryResults[p.category].total+=1;
  if(isCorrect){state.correct+=1;state.categoryResults[p.category].correct+=1;$("#feedbackTitle").textContent="Exactly right";$("#feedbackText").textContent=p.explanation;$("#feedbackIcon").textContent="✓"}
  else{$("#feedbackCard").classList.add("bad");$("#feedbackTitle").textContent=index<0?"Time’s up":"Good try";$("#feedbackText").textContent=p.explanation;$("#feedbackIcon").textContent="↗"}
  $("#nextButton").innerHTML=state.index===state.run.length-1?'See score <span>→</span>':'Next <span>→</span>';
  setTimeout(()=>$("#feedbackCard").classList.add("show"),120);
}
function nextPuzzle(){
  if(!state.answered)return;
  if(state.index<state.run.length-1){state.index+=1;renderPuzzle()}else finishRun();
}
function finishRun(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);
  const accuracy=state.correct/state.run.length;
  const avgTime=state.responseTimes.length?state.responseTimes.reduce((a,b)=>a+b,0)/state.responseTimes.length:20;
  const speedBonus=Math.max(0,Math.round((20-avgTime)*4));
  const score=Math.min(999,Math.round(500+accuracy*350+speedBonus));
  const percentile=Math.max(2,Math.min(70,Math.round(61-accuracy*52-speedBonus/15)));
  $("#finalScore").textContent=score;$("#scoreDelta").textContent=score>=820?"↑ strong run today":score>=700?"solid work today":"room to grow";
  $("#rankText").textContent=`Top ${percentile}%`;$("#correctText").textContent=`${state.correct} / ${state.run.length} correct`;
  $("#resultEyebrow").innerHTML=state.mode==="daily"?'<span></span> Daily run complete':'<span></span> Practice complete';
  $("#resultTitle").textContent=state.mode==="daily"?"Beautiful thinking.":"Nice training.";
  $("#resultSubtitle").textContent=state.mode==="daily"?"Here’s how your mind performed today.":`${state.skill||"Mixed"} practice is complete.`;

  const rate=names=>{let right=0,total=0;names.forEach(name=>{const r=state.categoryResults[name];if(r){right+=r.correct;total+=r.total}});return total?right/total:accuracy};
  const pattern=Math.min(99,Math.round(58+rate(["PATTERN","FINAL"])*39));
  const logic=Math.min(99,Math.round(56+rate(["LOGIC"])*40));
  const focus=Math.min(99,Math.round(55+rate(["FOCUS","MEMORY"])*41));
  const speed=Math.min(99,Math.max(45,Math.round(98-avgTime*2.25)));
  [["pattern",pattern],["logic",logic],["focus",focus],["speed",speed]].forEach(([name,value])=>$("#"+name+"Score").textContent=value);

  if(state.mode==="daily"){
    const previousBest=Number(localStorage.getItem("iqgames-best")||0),newBest=Math.max(score,previousBest);
    localStorage.setItem("iqgames-best",String(newBest));$("#homeBestScore").textContent=newBest||842;
  }
  showScreen("result");
  requestAnimationFrame(()=>setTimeout(()=>{ $("#patternBar").style.width=pattern+"%";$("#logicBar").style.width=logic+"%";$("#focusBar").style.width=focus+"%";$("#speedBar").style.width=speed+"%";},250));
}
function goHome(){clearInterval(state.timer);clearTimeout(state.memoryTimeout);showScreen("home");$("#feedbackCard").classList.remove("show")}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
async function shareScore(){
  const score=$("#finalScore").textContent,text=`I scored ${score} on IQ Games. Can you beat me?`;
  if(navigator.share){try{await navigator.share({title:"IQ Games",text})}catch(_){}}
  else if(navigator.clipboard){await navigator.clipboard.writeText(text);showToast("Score copied to clipboard")}else showToast(text);
}

$("#startRunButton").addEventListener("click",startRun);$("#nextButton").addEventListener("click",nextPuzzle);
$("#exitGameButton").addEventListener("click",goHome);$("#homeButton").addEventListener("click",goHome);$("#brandButton").addEventListener("click",goHome);$("#shareButton").addEventListener("click",shareScore);
$("#practiceButton").addEventListener("click",()=>startPractice("Mixed"));
$$(".skill-card").forEach(card=>card.addEventListener("click",()=>startPractice(card.dataset.skill)));
$$(".nav-item").forEach(item=>item.addEventListener("click",()=>{if(item.dataset.nav==="practice")startPractice("Mixed");else if(item.dataset.nav==="profile")showToast("Profile is the next screen")}));

const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const dayWords=["Reset","Momentum","Spark","Clarity","Rhythm","Focus","Challenge"];
$("#dailyTitle").textContent=`${dayNames[new Date().getDay()]} ${dayWords[new Date().getDay()]}`;
const storedBest=Number(localStorage.getItem("iqgames-best")||842);$("#homeBestScore").textContent=storedBest;