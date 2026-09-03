const S=(shape,tone="violet",rotation=0)=>({kind:"shape",shape,tone,rotation});
const T=(text,sub="")=>({kind:"text",text:String(text),sub});
const D=(spots)=>({kind:"dotpattern",spots});
const H=(points)=>({kind:"shadow",points});
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
    title:final?"Unlock the last tile":"Complete the matrix",hint:"Every row and column follows the same rule.",
    board:[a,b,c,b,c,a,c,a,null],...pack,explanation:"Each row uses the same three shapes, shifted one place."};
}
function makeOdd(rand){
  const base=[0,90,180,270][Math.floor(rand()*4)],odd=(base+90)%360,oddIndex=Math.floor(rand()*4);
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
  while(choices.size<4)choices.add(Math.floor(rand()*9)+1);
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
    hint:"The arrow turns the same amount each step.",board:[...angles.map(a=>S("arrow",tone,a)),null],
    answers:choices.map(a=>S("arrow",tone,a)),correct:choices.indexOf(correctRotation),
    explanation:"The arrow rotates 90° clockwise on every step."};
}
function makeEquation(rand){
  const diamond=3+Math.floor(rand()*5);
  let circle=1+Math.floor(rand()*6);if(circle===diamond)circle=(circle%6)+1;
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
function makeOneMove(rand){
  const labels=["A","B","C"];
  const towers=shuffleCopy([
    {label:labels[0],height:2,tone:"peach"},
    {label:labels[1],height:3,tone:"mint"},
    {label:labels[2],height:4,tone:"violet"}
  ],rand);
  const low=towers.find(t=>t.height===2).label,high=towers.find(t=>t.height===4).label;
  const correct=`${high} → ${low}`;
  const distractors=[
    `${low} → ${high}`,
    `${towers.find(t=>t.height===3).label} → ${low}`,
    `${high} → ${towers.find(t=>t.height===3).label}`
  ];
  const pack=answerPack(T(correct,"MOVE ONE GEM"),distractors.map(x=>T(x,"MOVE ONE GEM")),rand);
  return {type:"onemove",category:"STRATEGY",prompt:"One move only",title:"Make the towers equal",
    hint:"Tap the tower to take from, then tap where the gem should go.",towers,source:high,destination:low,...pack,
    explanation:`Move one gem from ${high} to ${low}. All three towers then have 3 gems.`};
}
function makeBalance(rand){
  const pack=answerPack(S("circle","peach"),[S("diamond","yellow"),S("ring","mint"),S("triangle","blue")],rand);
  return {type:"balance",category:"LOGIC",prompt:"Balance the scales",title:"What belongs on the right?",
    hint:"The top scale gives you the rule.",...pack,
    explanation:"Two circles balance one square. So one square balances a circle plus one more circle."};
}
function makeFold(rand){
  const correct=D([0,3,12,15]);
  const distractors=[D([0,15]),D([0,5,10,15]),D([3,6,9,12])];
  const pack=answerPack(correct,distractors,rand);
  return {type:"fold",category:"SPATIAL",prompt:"Fold it in your mind",title:"Where will the holes appear?",
    hint:"The paper is folded twice, then punched once.",...pack,
    explanation:"Unfolding mirrors the punch across both folds, creating four corner holes."};
}
function makeShadow(rand){
  const target=[[18,50,20],[45,31,15],[65,53,18],[47,71,14]];
  const correct=H(target);
  const distractors=[
    H([[18,50,20],[45,31,15],[68,49,18],[50,74,14]]),
    H([[20,33,17],[48,48,20],[72,35,14],[52,70,16]]),
    H([[18,50,20],[45,31,15],[65,53,18]])
  ];
  const pack=answerPack(correct,distractors,rand);
  return {type:"shadow",category:"SPATIAL",prompt:"See the silhouette",title:"Which shadow matches?",
    hint:"Ignore color. Match the exact arrangement.",target,...pack,
    explanation:"The correct shadow preserves all four shapes in the same relative positions."};
}
function makePath(rand){
  const winner=Math.floor(rand()*4);
  return {type:"path",category:"FOCUS",prompt:"Trace with your eyes",title:"Which path reaches the star?",
    hint:"Don’t cross the lines. Follow each path from its letter.",winner,
    answers:["A","B","C","D"].map(x=>T(x,"PATH")),correct:winner,
    explanation:`Path ${["A","B","C","D"][winner]} is the only route that reaches the star.`};
}
function tunePuzzle(p,difficulty,timeLimit){
  return {...p,difficulty,timeLimit};
}
function makeDailyRun(key=localDateKey()){
  const rand=mulberry32(seedFromString(key));
  const opener=tunePuzzle(makeOneMove(rand),"WARM-UP",24);
  const easy=tunePuzzle(shuffleCopy([makeOdd(rand),makePath(rand)],rand)[0],"WARM-UP",22);
  const medium=shuffleCopy([
    tunePuzzle(makeBalance(rand),"STEADY",22),
    tunePuzzle(makeMemory(rand),"STEADY",20),
    tunePuzzle(makeRotation(rand),"STEADY",20)
  ],rand);
  const stretch=tunePuzzle(shuffleCopy([makeFold(rand),makeShadow(rand),makeEquation(rand)],rand)[0],"STRETCH",26);
  const final=tunePuzzle(makeMatrix(rand,true),"FINAL",30);
  return [opener,easy,...medium,stretch,final];
}
function makePracticeRun(skill="Mixed"){
  const rand=Math.random;
  const ramp=items=>items.map((p,i)=>tunePuzzle(p,i===0?"WARM-UP":i===items.length-1?"STRETCH":"STEADY",i===0?24:i===items.length-1?26:22));
  if(skill==="Pattern")return ramp([makeSequence(rand),makeMatrix(rand),makeSequence(rand),makeMatrix(rand,true)]);
  if(skill==="Focus")return ramp([makeOdd(rand),makePath(rand),makeMemory(rand),makePath(rand)]);
  if(skill==="Spatial")return ramp([makeRotation(rand),makeFold(rand),makeShadow(rand),makeRotation(rand)]);
  if(skill==="Logic")return ramp([makeBalance(rand),makeEquation(rand),makeOneMove(rand),makeMatrix(rand)]);
  if(skill==="Strategy")return ramp([makeOneMove(rand),makeBalance(rand),makePath(rand),makeOneMove(rand)]);
  return ramp([makeOneMove(rand),makePath(rand),makeBalance(rand),makeFold(rand),makeShadow(rand)]);
}

const state={index:0,correct:0,answered:false,timeLeft:20,currentLimit:20,timer:null,memoryTimeout:null,responseTimes:[],categoryResults:{},questionStartedAt:0,run:[],mode:"daily",skill:""};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const screens={home:$("#homeScreen"),game:$("#gameScreen"),result:$("#resultScreen"),practice:$("#practiceScreen"),profile:$("#profileScreen")};

function showScreen(name){
  Object.values(screens).forEach(screen=>screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  $("#bottomNav").style.display=(name==="home"||name==="practice"||name==="profile")?"flex":"none";
  $$(".nav-item").forEach(item=>item.classList.toggle("active",item.dataset.nav===name));
  window.scrollTo({top:0,behavior:"smooth"});
}
function shapeMarkup(item){
  if(!item)return '<span aria-hidden="true">?</span>';
  if(item.kind==="text")return `<span class="answer-text">${item.text}${item.sub?`<small class="answer-sub">${item.sub}</small>`:""}</span>`;
  if(item.kind==="dotpattern"){
    return `<span class="dot-pattern">${Array.from({length:16},(_,i)=>`<i class="${item.spots.includes(i)?"on":""}"></i>`).join("")}</span>`;
  }
  if(item.kind==="shadow"){
    return `<svg class="shadow-choice" viewBox="0 0 100 100" aria-hidden="true">${item.points.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"></circle>`).join("")}</svg>`;
  }
  return `<span class="shape ${item.shape} tone-${item.tone}" style="--rotation:${item.rotation||0}deg" aria-hidden="true"></span>`;
}
function tileMarkup(item,index,numbered=false){
  return `<div class="tile ${!item?"question":""}">${numbered?`<span class="tile-number">${index+1}</span>`:""}${shapeMarkup(item)}</div>`;
}

function pathSvg(winner){
  const endings=[
    {x:278,y:55},{x:278,y:92},{x:278,y:129},{x:278,y:166}
  ];
  const colors=["#ffaf82","#84cdb9","#8b78ec","#82b7f1"];
  const starts=[42,78,114,150];
  const routes=[
    [[40,42],[85,42],[85,68],[142,68],[142,45],[205,45]],
    [[40,78],[105,78],[105,112],[165,112],[165,84],[220,84]],
    [[40,114],[75,114],[75,150],[145,150],[145,125],[215,125]],
    [[40,150],[100,150],[100,132],[182,132],[182,166],[230,166]]
  ];
  const starX=278,starY=starts[winner];
  const routeGroups=routes.map((pts,i)=>{
    const end=i===winner?[starX-16,starY]:endings[(i+1)%4];
    const all=[...pts,end];
    const points=all.map(p=>p.join(",")).join(" ");
    return `<g class="path-route" data-route="${i}" tabindex="0" role="button" aria-label="Choose path ${["A","B","C","D"][i]}">
      <polyline class="path-hit" points="${points}" fill="none" stroke="transparent" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline class="path-visible" points="${points}" fill="none" stroke="${colors[i]}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="24" cy="${starts[i]}" r="14" fill="${colors[i]}"/>
      <text x="24" y="${starts[i]+4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${["A","B","C","D"][i]}</text>
    </g>`;
  }).join("");
  return `<svg class="path-map" viewBox="0 0 320 205" aria-label="Choose the route that reaches the star">
    <rect x="4" y="5" width="312" height="195" rx="28" fill="#fbfaf7"/>
    ${routeGroups}
    <g class="path-star" transform="translate(${starX},${starY})"><path d="M0-14 4-4 15-4 6 3 10 14 0 8-10 14-6 3-15-4-4-4Z" fill="#ffd365"/></g>
    <circle cx="${starX}" cy="${starY}" r="23" fill="none" stroke="#f1d583" stroke-width="2" stroke-dasharray="3 5"/>
    <text x="${starX}" y="${starY+38}" text-anchor="middle" font-size="8" font-weight="800" fill="#aaa3a0" letter-spacing="1">GOAL</text>
  </svg>`;
}

function renderBoard(p){
  const board=$("#puzzleBoard");board.className=`puzzle-board ${p.type}`;
  if(p.type==="equations"){
    board.innerHTML=p.board.map(row=>`<div class="equation"><span class="mini-shape">${shapeMarkup(row.left)}</span><span class="equation-symbol">${row.op}</span>${row.right?`<span class="mini-shape">${shapeMarkup(row.right)}</span><span class="equation-symbol">=</span>`:""}<span class="equation-value">${row.value}</span></div>`).join("");return;
  }
  if(p.type==="odd"){
    board.innerHTML=p.board.map((item,i)=>`<div class="odd-card"><b>${i+1}</b>${shapeMarkup(item)}</div>`).join("");return;
  }
  if(p.type==="onemove"){
    board.innerHTML=`<div class="move-board">${p.towers.map(t=>`<button class="gem-tower" data-tower="${t.label}" aria-label="Tower ${t.label}, ${t.height} gems"><span class="tower-label">${t.label}</span><div class="gem-stack">${Array.from({length:t.height},()=>`<i class="gem tone-${t.tone}"></i>`).join("")}</div><span class="tower-count">${t.height}</span><span class="tower-action">tap</span><span class="tower-pedestal"></span></button>`).join("")}<div class="move-goal">ONE MOVE <span>→</span> 3 · 3 · 3</div></div>`;return;
  }
  if(p.type==="balance"){
    board.innerHTML=`<div class="balance-board">
      <div class="scale scale-one"><span class="beam"></span><span class="pivot">◆</span><div class="pan left"><span class="mini-shape">${shapeMarkup(S("circle","peach"))}</span><span class="mini-shape">${shapeMarkup(S("circle","peach"))}</span></div><div class="pan right"><span class="mini-shape">${shapeMarkup(S("square","violet"))}</span></div></div>
      <div class="scale scale-two interactive-scale"><span class="beam"></span><span class="pivot">◆</span><div class="pan left"><span class="mini-shape">${shapeMarkup(S("square","violet"))}</span></div><div class="pan right balance-dropzone" data-dropzone="balance"><span class="drop-halo">DROP</span><span class="mini-shape">${shapeMarkup(S("circle","peach"))}</span><b class="mystery-weight">?</b></div></div>
      <div class="balance-tray" aria-label="Choose a shape to balance the scale">${p.answers.map((item,i)=>`<button class="balance-piece" draggable="true" data-answer="${i}" aria-label="Candidate ${i+1}">${shapeMarkup(item)}</button>`).join("")}</div>
    </div>`;return;
  }
  if(p.type==="fold"){
    board.innerHTML=`<div class="fold-board">
      <button class="paper-stage" id="paperStage" aria-label="Tap to perform the next fold">
        <span class="paper-sheet paper-base"></span>
        <span class="paper-sheet paper-fold-x"></span>
        <span class="paper-sheet paper-fold-y"></span>
        <span class="fold-line vertical"></span><span class="fold-line horizontal"></span>
        <span class="punch" id="foldPunch"></span>
        <span class="fold-arrow arrow-x">→</span><span class="fold-arrow arrow-y">↓</span>
        <span class="fold-tap">tap paper</span><span class="fold-corner-cue">↙</span>
      </button>
      <div class="fold-steps"><span class="active">1. Fold right</span><span>2. Fold down</span><span>3. Punch</span></div>
    </div>`;return;
  }
  if(p.type==="shadow"){
    const target=H(p.target);
    board.innerHTML=`<div class="shadow-board"><div class="light-source">☀</div><div class="light-ray ray-a"></div><div class="light-ray ray-b"></div><div class="object-cluster">
      <span class="float-shape fs-a"></span><span class="float-shape fs-b"></span><span class="float-shape fs-c"></span><span class="float-shape fs-d"></span>
    </div><div class="shadow-floor"><span class="soft-cast"></span></div></div>`;return;
  }
  if(p.type==="path"){
    board.innerHTML=pathSvg(p.winner);return;
  }
  board.innerHTML=p.board.map((item,i)=>tileMarkup(item,i,p.type==="memory")).join("");
}
function setInteractiveMode(active,label=""){
  $("#answersGrid").classList.toggle("interaction-hidden",active);
  $("#answerLabel").classList.toggle("interaction-label",active);
  if(active && label) $("#answerLabel").textContent=label;
}

function setupOneMove(p){
  setInteractiveMode(true,"TAP A SOURCE, THEN A DESTINATION");
  let source=null;
  const towers=$$$(".gem-tower");
  towers.forEach(tower=>{
    tower.addEventListener("click",()=>{
      if(state.answered)return;
      const label=tower.dataset.tower;
      if(!source){
        source=label;
        towers.forEach(x=>x.classList.toggle("selected-source",x.dataset.tower===label));
        $("#answerLabel").textContent=`MOVE FROM ${label} → CHOOSE DESTINATION`;
        return;
      }
      if(label===source){
        source=null;
        towers.forEach(x=>x.classList.remove("selected-source"));
        $("#answerLabel").textContent="TAP A SOURCE, THEN A DESTINATION";
        return;
      }
      const sourceTower=p.towers.find(t=>t.label===source);
      const destinationTower=p.towers.find(t=>t.label===label);
      if(!sourceTower || !destinationTower || sourceTower.height<1)return;

      sourceTower.height-=1;destinationTower.height+=1;
      const sourceEl=$(`.gem-tower[data-tower="${source}"]`);
      const destinationEl=$(`.gem-tower[data-tower="${label}"]`);
      const movingGem=sourceEl.querySelector(".gem-stack .gem:last-child");
      if(movingGem){
        movingGem.classList.add("gem-lift");
        setTimeout(()=>{
          movingGem.remove();
          const newGem=document.createElement("i");
          newGem.className=`gem tone-${sourceTower.tone} gem-drop`;
          destinationEl.querySelector(".gem-stack").appendChild(newGem);
        },180);
      }
      sourceEl.querySelector(".tower-count").textContent=sourceTower.height;
      destinationEl.querySelector(".tower-count").textContent=destinationTower.height;
      towers.forEach(x=>x.classList.remove("selected-source"));

      const isCorrectMove=source===p.source && label===p.destination;
      const answerIndex=isCorrectMove?p.correct:p.answers.findIndex((_,i)=>i!==p.correct);
      setTimeout(()=>chooseAnswer(answerIndex),320);
    });
  });
}

function setupBalance(p){
  setInteractiveMode(true,"DRAG OR TAP A SHAPE ONTO THE ? PAN");
  const dropzone=$(".balance-dropzone");
  const pieces=$(".balance-piece");

  const submit=index=>{
    if(state.answered)return;
    const chosen=pieces[index];
    if(!chosen)return;
    pieces.forEach(piece=>piece.classList.remove("chosen"));
    chosen.classList.add("chosen");
    dropzone.classList.add("filled");
    const mystery=dropzone.querySelector(".mystery-weight");
    if(mystery){
      mystery.innerHTML=shapeMarkup(p.answers[index]);
      mystery.classList.add("placed-weight");
    }
    $(".interactive-scale")?.classList.add(index===p.correct?"balanced":"unbalanced");
    setTimeout(()=>chooseAnswer(index),300);
  };

  pieces.forEach((piece,index)=>{
    piece.addEventListener("click",()=>submit(index));
    piece.addEventListener("dragstart",e=>{
      e.dataTransfer?.setData("text/plain",String(index));
      piece.classList.add("dragging");
    });
    piece.addEventListener("dragend",()=>piece.classList.remove("dragging"));
  });

  dropzone.addEventListener("dragover",e=>{e.preventDefault();dropzone.classList.add("drag-over")});
  dropzone.addEventListener("dragleave",()=>dropzone.classList.remove("drag-over"));
  dropzone.addEventListener("drop",e=>{
    e.preventDefault();dropzone.classList.remove("drag-over");
    const index=Number(e.dataTransfer?.getData("text/plain"));
    if(Number.isInteger(index))submit(index);
  });
}

function setupFold(p){
  setInteractiveMode(true,"TAP THE PAPER TO FOLD IT");
  const stage=$("#paperStage");
  const steps=$(".fold-steps span");
  let phase=0;

  const setPhase=next=>{
    phase=next;
    stage.dataset.phase=String(phase);
    steps.forEach((step,i)=>step.classList.toggle("active",i===Math.min(phase,2)));
    if(phase===0){
      $("#answerLabel").textContent="TAP THE PAPER TO FOLD RIGHT";
      stage.querySelector(".fold-tap").textContent="tap to fold";
    }else if(phase===1){
      $("#answerLabel").textContent="GOOD — TAP AGAIN TO FOLD DOWN";
      stage.querySelector(".fold-tap").textContent="tap again";
    }else if(phase===2){
      $("#answerLabel").textContent="NOW TAP ONCE TO PUNCH";
      stage.querySelector(".fold-tap").textContent="tap to punch";
    }else{
      $("#answerLabel").textContent="NOW CHOOSE THE UNFOLDED PAPER";
      stage.querySelector(".fold-tap").textContent="done";
      $("#answersGrid").classList.remove("interaction-hidden");
      $("#answersGrid").classList.add("fold-answers-reveal");
      stage.disabled=true;
    }
  };

  stage.addEventListener("click",()=>{
    if(state.answered||phase>=3)return;
    setPhase(phase+1);
  });
  setPhase(0);
}

function setupPath(p){
  setInteractiveMode(true,"TAP THE PATH THAT REACHES THE STAR");
  $$(".path-route").forEach(route=>{
    const activate=()=>{
      if(state.answered)return;
      const index=Number(route.dataset.route);
      route.classList.add("route-chosen");
      chooseAnswer(index);
      $$(".path-route").forEach((r,i)=>{
        if(i===p.correct)r.classList.add("route-correct");
        else if(i===index && i!==p.correct)r.classList.add("route-wrong");
      });
    };
    route.addEventListener("click",activate);
    route.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate()}});
  });
}

function setupPuzzleInteraction(p){
  setInteractiveMode(false);
  if(p.type==="onemove")setupOneMove(p);
  if(p.type==="path")setupPath(p);
  if(p.type==="balance")setupBalance(p);
  if(p.type==="fold")setupFold(p);
}

function renderAnswers(p){
  const answers=$("#answersGrid");answers.className="answers-grid";
  answers.innerHTML=p.answers.map((answer,i)=>`<button class="answer-button ${answer.kind==="dotpattern"?"pattern-answer":answer.kind==="shadow"?"shadow-answer":""}" data-answer="${i}" aria-label="Answer ${i+1}">${shapeMarkup(answer)}</button>`).join("");
  $$(".answer-button").forEach(btn=>btn.addEventListener("click",()=>chooseAnswer(Number(btn.dataset.answer))));
}
function resetRun(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);state.index=0;state.correct=0;state.answered=false;state.responseTimes=[];state.categoryResults={};
}
function startRun(){resetRun();state.mode="daily";state.skill="";state.run=makeDailyRun();showScreen("game");renderPuzzle()}
function startPractice(skill="Mixed"){resetRun();state.mode="practice";state.skill=skill;state.run=makePracticeRun(skill);showScreen("game");renderPuzzle()}
function startTimer(){
  clearInterval(state.timer);state.timeLeft=state.currentLimit||20;state.questionStartedAt=Date.now();$("#timerText").textContent=state.timeLeft;
  state.timer=setInterval(()=>{if(state.answered)return;state.timeLeft-=1;$("#timerText").textContent=Math.max(0,state.timeLeft);if(state.timeLeft<=0){clearInterval(state.timer);chooseAnswer(-1)}},1000);
}
function animatePuzzleEntrance(){
  const stage=$("#puzzleStage");
  stage.classList.remove("puzzle-enter","puzzle-leaving");
  void stage.offsetWidth;
  stage.classList.add("puzzle-enter");
  setTimeout(()=>stage.classList.remove("puzzle-enter"),520);
}
function celebrateStage(){
  const stage=$("#puzzleStage");
  const burst=document.createElement("div");
  burst.className="success-burst";
  burst.innerHTML=Array.from({length:8},(_,i)=>`<i style="--i:${i}"></i>`).join("");
  stage.appendChild(burst);
  setTimeout(()=>burst.remove(),850);
}
function animateScoreValue(target){
  const el=$("#finalScore");
  const start=performance.now(),duration=760;
  const tick=now=>{
    const t=Math.min(1,(now-start)/duration);
    const eased=1-Math.pow(1-t,3);
    el.textContent=Math.round(target*eased);
    if(t<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function renderPuzzle(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);state.answered=false;
  const p=state.run[state.index];
  state.currentLimit=p.timeLimit||20;
  $("#questionCounter").textContent=`${state.index+1} of ${state.run.length}`;$("#gameCategory").textContent=`${p.category} · ${p.difficulty||"STEADY"}`;$("#stageChip").textContent=p.category;
  $("#puzzleStage").dataset.difficulty=p.difficulty||"STEADY";
  $("#modePrompt").innerHTML=`<span></span> ${p.prompt}`;$("#questionTitle").textContent=p.title;$("#questionHint").textContent=p.hint;
  $("#progressBar").style.width=`${((state.index+1)/state.run.length)*100}%`;$("#feedbackCard").classList.remove("show","bad");$("#memoryCurtain").classList.remove("show");
  $("#puzzleStage").dataset.type=p.type;$("#puzzleStage").classList.remove("stage-correct","stage-wrong");
  $("#answerLabel").textContent=p.type==="memory"?"MEMORIZE FIRST":"CHOOSE YOUR ANSWER";
  renderBoard(p);renderAnswers(p);setupPuzzleInteraction(p);animatePuzzleEntrance();
  if(p.type==="memory"){
    $("#answersGrid").classList.add("waiting");$("#timerText").textContent="—";
    state.memoryTimeout=setTimeout(()=>{$("#memoryCurtain").classList.add("show");setTimeout(()=>{
      $("#puzzleBoard").innerHTML=p.board.map((_,i)=>`<div class="tile"><span class="answer-text">${i+1}</span></div>`).join("");
      $("#memoryCurtain").classList.remove("show");$("#questionTitle").textContent="Where was the diamond?";$("#questionHint").textContent="Choose the position that held the yellow diamond.";
      $("#answerLabel").textContent="CHOOSE THE POSITION";$("#answersGrid").classList.remove("waiting");startTimer();
    },420)},p.revealAfter);
  }else startTimer();
}
function chooseAnswer(index){
  if(state.answered||$("#answersGrid").classList.contains("waiting"))return;
  state.answered=true;clearInterval(state.timer);clearTimeout(state.memoryTimeout);
  const p=state.run[state.index],buttons=$$(".answer-button"),isCorrect=index===p.correct;
  if(index>=0&&buttons[index])buttons[index].classList.add(isCorrect?"correct":"wrong");
  if(!isCorrect&&buttons[p.correct])buttons[p.correct].classList.add("correct");
  if(p.type==="onemove"){
    $$(".gem-tower").forEach(t=>{
      const model=p.towers.find(x=>x.label===t.dataset.tower);
      if(model && model.height===3)t.classList.add("tower-balanced");
    });
  }
  const seconds=Math.max(0,Math.min(state.currentLimit||20,(Date.now()-state.questionStartedAt)/1000));state.responseTimes.push(seconds);
  if(!state.categoryResults[p.category])state.categoryResults[p.category]={correct:0,total:0};state.categoryResults[p.category].total+=1;
  if(isCorrect){state.correct+=1;state.categoryResults[p.category].correct+=1;$("#puzzleStage").classList.add("stage-correct");celebrateStage();$("#feedbackTitle").textContent="Exactly right";$("#feedbackText").textContent=p.explanation;$("#feedbackIcon").textContent="✓"}
  else{$("#puzzleStage").classList.add("stage-wrong");$("#feedbackCard").classList.add("bad");$("#feedbackTitle").textContent=index<0?"Time’s up":"Good try";$("#feedbackText").textContent=p.explanation;$("#feedbackIcon").textContent="↗"}
  $("#nextButton").innerHTML=state.index===state.run.length-1?'See score <span>→</span>':'Next <span>→</span>';setTimeout(()=>$("#feedbackCard").classList.add("show"),120);
}
function nextPuzzle(){
  if(!state.answered)return;
  if(state.index<state.run.length-1){
    const stage=$("#puzzleStage");
    stage.classList.add("puzzle-leaving");
    $("#feedbackCard").classList.remove("show");
    setTimeout(()=>{state.index+=1;renderPuzzle()},220);
  }else finishRun();
}
function finishRun(){
  clearInterval(state.timer);clearTimeout(state.memoryTimeout);
  const accuracy=state.correct/state.run.length,avgTime=state.responseTimes.length?state.responseTimes.reduce((a,b)=>a+b,0)/state.responseTimes.length:20;
  const speedBonus=Math.max(0,Math.round((22-avgTime)*3.5)),score=Math.min(999,Math.round(500+accuracy*350+speedBonus));
  const rank=score>=900?"Mastermind":score>=825?"Brilliant":score>=750?"Sharp":score>=675?"Focused":"Warming Up";
  $("#finalScore").textContent="0";$("#scoreDelta").textContent=score>=820?"↑ strong run today":score>=700?"solid work today":"room to grow";
  $("#rankText").textContent=rank;$("#correctText").textContent=`${state.correct} / ${state.run.length} correct`;
  $("#resultEyebrow").innerHTML=state.mode==="daily"?'<span></span> Daily run complete':'<span></span> Practice complete';
  $("#resultTitle").textContent=state.mode==="daily"?"Beautiful thinking.":"Nice training.";
  $("#resultSubtitle").textContent=state.mode==="daily"?"Here’s how your mind performed today.":`${state.skill||"Mixed"} practice is complete.`;
  const rate=names=>{let right=0,total=0;names.forEach(name=>{const r=state.categoryResults[name];if(r){right+=r.correct;total+=r.total}});return total?right/total:accuracy};
  const pattern=Math.min(99,Math.round(58+rate(["PATTERN","FINAL"])*39));
  const logic=Math.min(99,Math.round(56+rate(["LOGIC","STRATEGY"])*40));
  const focus=Math.min(99,Math.round(55+rate(["FOCUS","MEMORY"])*41));
  const speed=Math.min(99,Math.max(45,Math.round(98-avgTime*2.25)));
  [["pattern",pattern],["logic",logic],["focus",focus],["speed",speed]].forEach(([name,value])=>$("#"+name+"Score").textContent=value);

  const skills=[
    {name:"Pattern",value:pattern,practice:"Pattern"},
    {name:"Logic",value:logic,practice:"Logic"},
    {name:"Focus",value:focus,practice:"Focus"},
    {name:"Speed",value:speed,practice:"Focus"}
  ];
  const strongest=[...skills].sort((a,b)=>b.value-a.value)[0];
  const growth=[...skills].sort((a,b)=>a.value-b.value)[0];
  $("#insightTitle").textContent=`${strongest.name} was your strongest area.`;
  $("#insightText").textContent=growth.name===strongest.name
    ?"Balanced run — try a mixed sprint to keep pushing."
    :`Want to improve next? Train ${growth.practice.toLowerCase()} for a few rounds.`;
  $("#insightPracticeButton").dataset.skill=growth.name===strongest.name?"Mixed":growth.practice;
  $("#insightPracticeButton").textContent=growth.name===strongest.name?"Try mixed sprint →":`Train ${growth.practice} →`;

  if(state.mode==="daily"){
    const previousBest=Number(localStorage.getItem("iqgames-best")||0),newBest=Math.max(score,previousBest);
    localStorage.setItem("iqgames-best",String(newBest));$("#homeBestScore").textContent=newBest||"—";
  }
  const reward=saveRunProgress(score,accuracy);
  renderRunReward(reward);
  showScreen("result");$("#resultScreen").classList.add("result-reveal");animateScoreValue(score);requestAnimationFrame(()=>setTimeout(()=>{$("#patternBar").style.width=pattern+"%";$("#logicBar").style.width=logic+"%";$("#focusBar").style.width=focus+"%";$("#speedBar").style.width=speed+"%"},250));
}

function loadProgress(){
  return {
    best:Number(localStorage.getItem("iqgames-best")||0),
    xp:Number(localStorage.getItem("iqgames-xp")||0),
    runs:Number(localStorage.getItem("iqgames-runs")||0),
    correct:Number(localStorage.getItem("iqgames-correct")||0),
    questions:Number(localStorage.getItem("iqgames-questions")||0),
    streak:Number(localStorage.getItem("iqgames-streak")||0),
    lastDay:localStorage.getItem("iqgames-last-day")||"",
    rewardDay:localStorage.getItem("iqgames-reward-day")||"",
    shards:Number(localStorage.getItem("iqgames-shards")||0),
    sharp:localStorage.getItem("iqgames-badge-sharp")==="1"
  };
}
function daysBetweenKeys(a,b){
  if(!a||!b)return null;
  const [ay,am,ad]=a.split("-").map(Number),[by,bm,bd]=b.split("-").map(Number);
  return Math.round((Date.UTC(by,bm-1,bd)-Date.UTC(ay,am-1,ad))/86400000);
}
function saveRunProgress(score,accuracy){
  const p=loadProgress();
  p.runs+=1;p.correct+=state.correct;p.questions+=state.run.length;
  let earnedXp=Math.round(55+state.correct*13+Math.max(0,score-600)/9);
  let dailyBonus=false;
  p.xp+=earnedXp;
  if(accuracy>=.8){p.sharp=true;localStorage.setItem("iqgames-badge-sharp","1")}

  if(state.mode==="daily"){
    const today=localDateKey();
    if(p.lastDay!==today){
      const gap=daysBetweenKeys(p.lastDay,today);
      p.streak=gap===1?p.streak+1:1;
      localStorage.setItem("iqgames-streak",String(p.streak));
      localStorage.setItem("iqgames-last-day",today);
    }
    if(p.rewardDay!==today){
      dailyBonus=true;
      earnedXp+=75;p.xp+=75;p.shards+=1;
      localStorage.setItem("iqgames-reward-day",today);
      localStorage.setItem("iqgames-shards",String(p.shards));
    }
  }

  localStorage.setItem("iqgames-xp",String(p.xp));
  localStorage.setItem("iqgames-runs",String(p.runs));
  localStorage.setItem("iqgames-correct",String(p.correct));
  localStorage.setItem("iqgames-questions",String(p.questions));
  refreshProgressUI();
  return {earnedXp,dailyBonus,streak:p.streak,shards:p.shards};
}
function refreshProgressUI(){
  const p=loadProgress(),level=Math.floor(p.xp/500)+1,within=p.xp%500;
  if(p.lastDay && p.streak===0){p.streak=1;localStorage.setItem("iqgames-streak","1")}
  $("#headerStreak").textContent=p.streak;
  $("#homeStreak").textContent=p.streak+(p.streak===1?" day":" days");
  $("#streakGoal").textContent=Math.min(p.streak,7)+"/7";
  $("#streakRing").style.background=`conic-gradient(var(--violet) ${Math.min(100,(p.streak/7)*100)}%, #eceaf4 0)`;
  $("#profileBest").textContent=p.best||"—";
  $("#profileStreak").textContent=p.streak;
  $("#profileRuns").textContent=p.runs;
  $("#profileAccuracy").textContent=p.questions?Math.round((p.correct/p.questions)*100)+"%":"—";
  $("#profileLevel").textContent=level;
  $("#profileXpText").textContent=p.xp+" XP";
  $("#profileNextText").textContent=(500-within)+" to next level";
  $("#profileXpBar").style.width=(within/5)+"%";
  $("#badgeFirst").classList.toggle("unlocked",p.runs>=1);
  $("#badgeSharp").classList.toggle("unlocked",p.sharp);
  $("#badgeStreak").classList.toggle("unlocked",p.streak>=3);
  const completed=p.lastDay===localDateKey();
  $("#dailyStatusText").textContent=completed?"Replay it or train a skill":"Fresh challenge every day";
  $("#dailyCtaText").textContent=completed?"Run complete ✓":"Start today’s run";
  $("#startRunButton").classList.toggle("completed",completed);
}

function renderRunReward(reward){
  const card=$("#runRewardCard"),week=$("#streakWeek");
  card.classList.remove("daily","practice","bonus");
  card.classList.add(state.mode==="daily"?"daily":"practice");
  if(state.mode==="daily" && reward.dailyBonus)card.classList.add("bonus");

  $("#runRewardKicker").textContent=state.mode==="daily"?"DAILY COMPLETION":"PRACTICE XP";
  if(state.mode==="daily" && reward.dailyBonus){
    $("#runRewardTitle").textContent="Daily crystal earned";
    $("#runRewardText").textContent=`+${reward.earnedXp} XP · ${reward.shards} crystal${reward.shards===1?"":"s"} collected. New challenge tomorrow.`;
  }else if(state.mode==="daily"){
    $("#runRewardTitle").textContent="Today’s run replayed";
    $("#runRewardText").textContent=`+${reward.earnedXp} XP · Your daily crystal is already safe.`;
  }else{
    $("#runRewardTitle").textContent=`+${reward.earnedXp} XP added`;
    $("#runRewardText").textContent="Short practice still moves your level forward.";
  }

  if(state.mode==="daily"){
    week.hidden=false;
    const lit=Math.min(7,reward.streak||0);
    week.innerHTML=Array.from({length:7},(_,i)=>`<span class="${i<lit?"lit":""}">${i<lit?"✓":i+1}</span>`).join("");
  }else{
    week.hidden=true;week.innerHTML="";
  }
}

function goHome(){clearInterval(state.timer);clearTimeout(state.memoryTimeout);showScreen("home");$("#feedbackCard").classList.remove("show")}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");setTimeout(()=>toast.classList.remove("show"),1800)}
function roundRect(ctx,x,y,w,h,r){
  const radius=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}
function shareCardBlob(){
  return new Promise(resolve=>{
    const canvas=document.createElement("canvas");
    canvas.width=1080;canvas.height=1350;
    const ctx=canvas.getContext("2d");
    if(!ctx){resolve(null);return}

    const score=$("#finalScore").textContent;
    const rank=$("#rankText").textContent;
    const correct=$("#correctText").textContent;

    ctx.fillStyle="#F7F5EF";ctx.fillRect(0,0,canvas.width,canvas.height);

    const glow=ctx.createRadialGradient(860,120,20,860,120,430);
    glow.addColorStop(0,"rgba(174,229,212,.55)");glow.addColorStop(1,"rgba(174,229,212,0)");
    ctx.fillStyle=glow;ctx.fillRect(430,-180,650,650);
    const glow2=ctx.createRadialGradient(100,1170,20,100,1170,420);
    glow2.addColorStop(0,"rgba(255,217,119,.48)");glow2.addColorStop(1,"rgba(255,217,119,0)");
    ctx.fillStyle=glow2;ctx.fillRect(-250,800,700,550);

    ctx.fillStyle="#252533";ctx.font="800 54px Manrope, sans-serif";ctx.fillText("IQ Games",90,115);
    ctx.fillStyle="#7B7B8D";ctx.font="700 24px DM Sans, sans-serif";ctx.fillText("DAILY BRAIN CHALLENGE",90,158);

    ctx.fillStyle="rgba(255,255,255,.88)";roundRect(ctx,70,240,940,800,68);ctx.fill();
    ctx.strokeStyle="rgba(70,65,90,.06)";ctx.lineWidth=2;ctx.stroke();

    ctx.save();ctx.translate(540,520);ctx.rotate(4*Math.PI/180);
    const grad=ctx.createLinearGradient(-170,-170,170,170);grad.addColorStop(0,"#8D7CF7");grad.addColorStop(1,"#6251DF");
    ctx.fillStyle=grad;roundRect(ctx,-180,-180,360,360,108);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.78)";ctx.font="800 22px DM Sans, sans-serif";ctx.textAlign="center";ctx.fillText("BRAIN SCORE",0,-62);
    ctx.fillStyle="#FFFFFF";ctx.font="800 118px Manrope, sans-serif";ctx.fillText(score,0,55);
    ctx.restore();

    ctx.textAlign="center";ctx.fillStyle="#252533";ctx.font="800 58px Manrope, sans-serif";ctx.fillText(rank,540,800);
    ctx.fillStyle="#7B7B8D";ctx.font="700 27px DM Sans, sans-serif";ctx.fillText(correct,540,850);

    const pills=[["✦","Think"],["◇","Solve"],["◎","Repeat"]];
    pills.forEach((p,i)=>{
      const x=210+i*330;
      ctx.fillStyle=i===0?"#FFF0CD":i===1?"#E4F6EF":"#ECE8FF";
      roundRect(ctx,x-112,900,224,72,36);ctx.fill();
      ctx.fillStyle="#55505F";ctx.font="800 23px DM Sans, sans-serif";ctx.fillText(p[0]+"  "+p[1],x,945);
    });

    ctx.fillStyle="#8A8795";ctx.font="700 24px DM Sans, sans-serif";
    ctx.fillText("How sharp is your mind today?",540,1135);
    ctx.fillStyle="#6D5CE7";ctx.font="800 30px Manrope, sans-serif";ctx.fillText("IQ GAMES",540,1215);

    canvas.toBlob(blob=>resolve(blob),"image/png",.96);
  });
}
async function shareScore(){
  const score=$("#finalScore").textContent,rank=$("#rankText").textContent;
  const text=`I scored ${score} (${rank}) on IQ Games. Can you beat me?`;
  try{
    const blob=await shareCardBlob();
    if(blob && typeof File!=="undefined"){
      const file=new File([blob],"iq-games-score.png",{type:"image/png"});
      if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
        await navigator.share({title:"IQ Games",text,files:[file]});return;
      }
    }
    if(navigator.share){await navigator.share({title:"IQ Games",text});return}
    if(navigator.clipboard){await navigator.clipboard.writeText(text);showToast("Score copied to clipboard");return}
    showToast(text);
  }catch(error){
    if(error?.name!=="AbortError")showToast("Sharing wasn’t available");
  }
}
$("#startRunButton").addEventListener("click",startRun);$("#nextButton").addEventListener("click",nextPuzzle);
$("#exitGameButton").addEventListener("click",goHome);$("#homeButton").addEventListener("click",goHome);$("#brandButton").addEventListener("click",goHome);$("#shareButton").addEventListener("click",shareScore);
$("#practiceButton").addEventListener("click",()=>showScreen("practice"));
$$("[data-practice]").forEach(button=>button.addEventListener("click",()=>startPractice(button.dataset.practice)));
$$(".skill-card").forEach(card=>card.addEventListener("click",()=>startPractice(card.dataset.skill)));
$$(".nav-item").forEach(item=>item.addEventListener("click",()=>{
  if(item.dataset.nav==="home")goHome();
  else if(item.dataset.nav==="practice")showScreen("practice");
  else if(item.dataset.nav==="profile"){refreshProgressUI();showScreen("profile")}
}));
$("#profileHomeButton").addEventListener("click",goHome);
$("#insightPracticeButton").addEventListener("click",()=>startPractice($("#insightPracticeButton").dataset.skill||"Mixed"));
const dayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],dayWords=["Reset","Momentum","Spark","Clarity","Rhythm","Focus","Challenge"];
$("#dailyTitle").textContent=`${dayNames[new Date().getDay()]} ${dayWords[new Date().getDay()]}`;
const storedBest=Number(localStorage.getItem("iqgames-best")||0);$("#homeBestScore").textContent=storedBest||"—";refreshProgressUI();

function applyCapturePreview(){
  const preview=new URLSearchParams(window.location.search).get("preview");
  if(!preview)return;
  document.body.classList.add("capture-mode");

  if(preview==="home"){
    showScreen("home");
    return;
  }

  const rand=mulberry32(seedFromString("iq-games-capture"));
  const configurations={
    onemove:{puzzle:tunePuzzle(makeOneMove(rand),"WARM-UP",24),position:1},
    path:{puzzle:tunePuzzle(makePath(rand),"WARM-UP",22),position:2},
    balance:{puzzle:tunePuzzle(makeBalance(rand),"STEADY",22),position:4},
    fold:{puzzle:tunePuzzle(makeFold(rand),"STRETCH",26),position:6}
  };
  const config=configurations[preview];
  if(!config)return;

  resetRun();
  state.mode="practice";
  state.skill="Capture";
  state.run=[config.puzzle];
  showScreen("game");
  renderPuzzle();
  clearInterval(state.timer);
  clearTimeout(state.memoryTimeout);
  state.timer=null;
  $("#questionCounter").textContent=`${config.position} of 7`;
  $("#progressBar").style.width=`${(config.position/7)*100}%`;
  $("#timerText").textContent=String(config.puzzle.timeLimit||20);
}
applyCapturePreview();