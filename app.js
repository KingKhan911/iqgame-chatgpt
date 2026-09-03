const S = (shape, tone = "violet", rotation = 0) => ({ kind: "shape", shape, tone, rotation });
const T = (text, sub = "") => ({ kind: "text", text, sub });

const puzzles = [
  {
    type: "sequence", category: "PATTERN", prompt: "Think carefully",
    title: "What comes next?", hint: "Find the hidden rule in the sequence.",
    board: [S("circle","peach"),S("square","violet"),S("circle","peach"),S("square","violet"),S("circle","peach"),null],
    answers: [S("square","violet"),S("circle","peach"),S("diamond","yellow"),S("ring","mint")],
    correct: 0, explanation: "The shapes alternate: circle, square, circle, square."
  },
  {
    type: "matrix", category: "LOGIC", prompt: "Find the rule",
    title: "Complete the matrix", hint: "Every row and column follows the same rule.",
    board: [
      S("circle","peach"),S("square","violet"),S("diamond","yellow"),
      S("square","violet"),S("diamond","yellow"),S("circle","peach"),
      S("diamond","yellow"),S("circle","peach"),null
    ],
    answers: [S("square","violet"),S("ring","mint"),S("triangle","blue"),S("circle","peach")],
    correct: 0, explanation: "Each row and column contains one circle, square, and diamond."
  },
  {
    type: "odd", category: "FOCUS", prompt: "Spot the difference",
    title: "Which one is different?", hint: "Three arrows point the same way.",
    board: [S("arrow","mint",45),S("arrow","mint",45),S("arrow","mint",135),S("arrow","mint",45)],
    answers: [T("1","TOP LEFT"),T("2","TOP RIGHT"),T("3","BOTTOM LEFT"),T("4","BOTTOM RIGHT")],
    correct: 2, explanation: "Tile 3 is the only arrow rotated in the opposite direction."
  },
  {
    type: "memory", category: "MEMORY", prompt: "Memorize",
    title: "Remember the board", hint: "You have a moment. Where is the yellow diamond?",
    board: [
      S("circle","peach"),S("ring","mint"),S("square","blue"),
      S("triangle","violet"),S("circle","mint"),S("diamond","yellow"),
      S("square","peach"),S("ring","blue"),S("triangle","rose")
    ],
    answers: [T("2","POSITION"),T("4","POSITION"),T("6","POSITION"),T("8","POSITION")],
    correct: 2, explanation: "The yellow diamond was in position 6.",
    revealAfter: 2600
  },
  {
    type: "sequence", category: "SPATIAL", prompt: "Rotate it",
    title: "Which direction is next?", hint: "The arrow turns the same amount each step.",
    board: [S("arrow","blue",0),S("arrow","blue",90),S("arrow","blue",180),S("arrow","blue",270),S("arrow","blue",0),null],
    answers: [S("arrow","blue",90),S("arrow","blue",180),S("arrow","blue",270),S("arrow","blue",0)],
    correct: 0, explanation: "The arrow rotates 90° clockwise on every step."
  },
  {
    type: "equations", category: "LOGIC", prompt: "Decode the values",
    title: "What is the circle worth?", hint: "Use the first two clues.",
    board: [
      {left:S("diamond","yellow"),op:"+",right:S("diamond","yellow"),value:"10"},
      {left:S("diamond","yellow"),op:"+",right:S("circle","peach"),value:"8"},
      {left:S("circle","peach"),op:"=",right:null,value:"?"}
    ],
    answers: [T("3"),T("4"),T("5"),T("6")],
    correct: 0, explanation: "A diamond is 5, so the circle must be 3."
  },
  {
    type: "matrix", category: "FINAL", prompt: "Final challenge",
    title: "Unlock the last tile", hint: "Follow the pattern across rows and columns.",
    board: [
      S("circle","peach"),S("diamond","yellow"),S("square","violet"),
      S("diamond","yellow"),S("square","violet"),S("circle","peach"),
      S("square","violet"),S("circle","peach"),null
    ],
    answers: [S("diamond","yellow"),S("ring","mint"),S("circle","peach"),S("square","violet")],
    correct: 0, explanation: "The three shapes shift one place left in each row."
  }
];

const state = {
  index:0, correct:0, answered:false, timeLeft:20, timer:null, memoryTimeout:null,
  responseTimes:[], categoryResults:{}, questionStartedAt:0
};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const screens = { home:$("#homeScreen"), game:$("#gameScreen"), result:$("#resultScreen") };

function showScreen(name){
  Object.values(screens).forEach(screen=>screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  $("#bottomNav").style.display = name === "home" ? "flex" : "none";
  window.scrollTo({top:0,behavior:"smooth"});
}

function shapeMarkup(item){
  if(!item) return '<span aria-hidden="true">?</span>';
  if(item.kind === "text") return `<span class="answer-text">${item.text}${item.sub ? `<small class="answer-sub">${item.sub}</small>` : ""}</span>`;
  return `<span class="shape ${item.shape} tone-${item.tone}" style="--rotation:${item.rotation || 0}deg" aria-hidden="true"></span>`;
}

function tileMarkup(item, index, numbered=false){
  const question = !item;
  return `<div class="tile ${question ? "question" : ""}">${numbered ? `<span class="tile-number">${index+1}</span>` : ""}${shapeMarkup(item)}</div>`;
}

function renderBoard(p){
  const board = $("#puzzleBoard");
  board.className = `puzzle-board ${p.type}`;

  if(p.type === "equations"){
    board.innerHTML = p.board.map(row => `
      <div class="equation">
        <span class="mini-shape">${shapeMarkup(row.left)}</span>
        <span class="equation-symbol">${row.op}</span>
        ${row.right ? `<span class="mini-shape">${shapeMarkup(row.right)}</span><span class="equation-symbol">=</span>` : ""}
        <span class="equation-value">${row.value}</span>
      </div>`
    ).join("");
    return;
  }

  if(p.type === "odd"){
    board.innerHTML = p.board.map((item,i)=>`<div class="odd-card"><b>${i+1}</b>${shapeMarkup(item)}</div>`).join("");
    return;
  }

  board.innerHTML = p.board.map((item,i)=>tileMarkup(item,i,p.type==="memory")).join("");
}

function renderAnswers(p){
  const answers = $("#answersGrid");
  answers.className = "answers-grid";
  answers.innerHTML = p.answers.map((answer,i)=>`
    <button class="answer-button" data-answer="${i}" aria-label="Answer ${i+1}">
      ${shapeMarkup(answer)}
    </button>`
  ).join("");

  $$(".answer-button").forEach(btn=>{
    btn.addEventListener("click",()=>chooseAnswer(Number(btn.dataset.answer)));
  });
}

function startRun(){
  clearInterval(state.timer); clearTimeout(state.memoryTimeout);
  state.index=0; state.correct=0; state.answered=false; state.responseTimes=[];
  state.categoryResults={};
  showScreen("game");
  renderPuzzle();
}

function startTimer(){
  clearInterval(state.timer);
  state.timeLeft=20;
  state.questionStartedAt=Date.now();
  $("#timerText").textContent=state.timeLeft;
  state.timer=setInterval(()=>{
    if(state.answered) return;
    state.timeLeft-=1;
    $("#timerText").textContent=Math.max(0,state.timeLeft);
    if(state.timeLeft<=0){ clearInterval(state.timer); chooseAnswer(-1); }
  },1000);
}

function renderPuzzle(){
  clearInterval(state.timer); clearTimeout(state.memoryTimeout);
  state.answered=false;
  const p=puzzles[state.index];

  $("#questionCounter").textContent=`${state.index+1} of ${puzzles.length}`;
  $("#gameCategory").textContent=p.category;
  $("#stageChip").textContent=p.category;
  $("#modePrompt").innerHTML=`<span></span> ${p.prompt}`;
  $("#questionTitle").textContent=p.title;
  $("#questionHint").textContent=p.hint;
  $("#progressBar").style.width=`${((state.index+1)/puzzles.length)*100}%`;
  $("#feedbackCard").classList.remove("show","bad");
  $("#memoryCurtain").classList.remove("show");
  $("#answerLabel").textContent=p.type==="memory" ? "MEMORIZE FIRST" : "CHOOSE YOUR ANSWER";

  renderBoard(p);
  renderAnswers(p);

  if(p.type==="memory"){
    $("#answersGrid").classList.add("waiting");
    $("#timerText").textContent="—";
    state.memoryTimeout=setTimeout(()=>{
      $("#memoryCurtain").classList.add("show");
      setTimeout(()=>{
        const board=$("#puzzleBoard");
        board.innerHTML=p.board.map((_,i)=>`<div class="tile"><span class="answer-text">${i+1}</span></div>`).join("");
        $("#memoryCurtain").classList.remove("show");
        $("#questionTitle").textContent="Where was the diamond?";
        $("#questionHint").textContent="Choose the position that held the yellow diamond.";
        $("#answerLabel").textContent="CHOOSE THE POSITION";
        $("#answersGrid").classList.remove("waiting");
        startTimer();
      },420);
    },p.revealAfter);
  } else {
    startTimer();
  }
}

function chooseAnswer(index){
  if(state.answered || $("#answersGrid").classList.contains("waiting")) return;
  state.answered=true; clearInterval(state.timer); clearTimeout(state.memoryTimeout);

  const p=puzzles[state.index];
  const buttons=$$(".answer-button");
  const isCorrect=index===p.correct;
  if(index>=0 && buttons[index]) buttons[index].classList.add(isCorrect?"correct":"wrong");
  if(!isCorrect && buttons[p.correct]) buttons[p.correct].classList.add("correct");

  const responseSeconds=Math.max(0,Math.min(20,(Date.now()-state.questionStartedAt)/1000));
  state.responseTimes.push(responseSeconds);
  if(!state.categoryResults[p.category]) state.categoryResults[p.category]={correct:0,total:0};
  state.categoryResults[p.category].total+=1;

  if(isCorrect){
    state.correct+=1;
    state.categoryResults[p.category].correct+=1;
    $("#feedbackTitle").textContent="Exactly right";
    $("#feedbackText").textContent=p.explanation;
    $("#feedbackIcon").textContent="✓";
  }else{
    $("#feedbackCard").classList.add("bad");
    $("#feedbackTitle").textContent=index<0?"Time’s up":"Good try";
    $("#feedbackText").textContent=p.explanation;
    $("#feedbackIcon").textContent="↗";
  }

  $("#nextButton").innerHTML=state.index===puzzles.length-1?'See score <span>→</span>':'Next <span>→</span>';
  setTimeout(()=>$("#feedbackCard").classList.add("show"),120);
}

function nextPuzzle(){
  if(!state.answered) return;
  if(state.index<puzzles.length-1){ state.index+=1; renderPuzzle(); }
  else finishRun();
}

function finishRun(){
  clearInterval(state.timer); clearTimeout(state.memoryTimeout);
  const accuracy=state.correct/puzzles.length;
  const avgTime=state.responseTimes.length?state.responseTimes.reduce((a,b)=>a+b,0)/state.responseTimes.length:20;
  const speedBonus=Math.max(0,Math.round((20-avgTime)*4));
  const score=Math.min(999,Math.round(500+state.correct*50+speedBonus));
  const percentile=Math.max(2,Math.min(65,Math.round(58-accuracy*50-speedBonus/14)));

  $("#finalScore").textContent=score;
  $("#scoreDelta").textContent=score>=820?"↑ strong run today":score>=700?"solid work today":"room to grow";
  $("#rankText").textContent=`Top ${percentile}%`;
  $("#correctText").textContent=`${state.correct} / ${puzzles.length} correct`;

  const categoryRate = names => {
    let right=0,total=0;
    names.forEach(name=>{ const r=state.categoryResults[name]; if(r){right+=r.correct;total+=r.total;} });
    return total ? right/total : accuracy;
  };

  const pattern=Math.min(99,Math.round(58+categoryRate(["PATTERN","FINAL"])*39));
  const logic=Math.min(99,Math.round(56+categoryRate(["LOGIC"])*40));
  const focus=Math.min(99,Math.round(55+categoryRate(["FOCUS","MEMORY"])*41));
  const speed=Math.min(99,Math.max(45,Math.round(98-avgTime*2.25)));

  [["pattern",pattern],["logic",logic],["focus",focus],["speed",speed]].forEach(([name,value])=>{
    $(`#${name}Score`).textContent=value;
  });

  const previousBest=Number(localStorage.getItem("iqgames-best")||0);
  const newBest=Math.max(score,previousBest);
  localStorage.setItem("iqgames-best",String(newBest));
  $("#homeBestScore").textContent=newBest || 842;

  showScreen("result");
  requestAnimationFrame(()=>setTimeout(()=>{
    $("#patternBar").style.width=pattern+"%";
    $("#logicBar").style.width=logic+"%";
    $("#focusBar").style.width=focus+"%";
    $("#speedBar").style.width=speed+"%";
  },250));
}

function goHome(){
  clearInterval(state.timer); clearTimeout(state.memoryTimeout);
  showScreen("home");
  $("#feedbackCard").classList.remove("show");
}

function showToast(message){
  const toast=$("#toast"); toast.textContent=message; toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),1800);
}

async function shareScore(){
  const score=$("#finalScore").textContent;
  const text=`I scored ${score} on today’s IQ Games challenge. Can you beat me?`;
  if(navigator.share){
    try{await navigator.share({title:"IQ Games",text});}catch(_){}
  }else if(navigator.clipboard){
    await navigator.clipboard.writeText(text); showToast("Score copied to clipboard");
  }else showToast(text);
}

$("#startRunButton").addEventListener("click",startRun);
$("#nextButton").addEventListener("click",nextPuzzle);
$("#exitGameButton").addEventListener("click",goHome);
$("#homeButton").addEventListener("click",goHome);
$("#brandButton").addEventListener("click",goHome);
$("#shareButton").addEventListener("click",shareScore);
$("#practiceButton").addEventListener("click",()=>showToast("Dedicated practice runs are next ✦"));
$$(".skill-card").forEach(card=>card.addEventListener("click",()=>showToast(`${card.dataset.skill} practice is next`)));
$$(".nav-item").forEach(item=>item.addEventListener("click",()=>{
  if(item.dataset.nav!=="home") showToast(`${item.dataset.nav[0].toUpperCase()+item.dataset.nav.slice(1)} is coming next`);
}));

const storedBest=Number(localStorage.getItem("iqgames-best")||842);
$("#homeBestScore").textContent=storedBest;