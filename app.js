const puzzles = [
  {
    category: "PATTERN",
    title: "What comes next?",
    hint: "Find the hidden rule in the sequence.",
    sequence: ["circle","square","circle","square","circle","?"],
    answers: ["square","circle","diamond","ring"],
    correct: 0,
    explanation: "The shapes alternate: circle, square, circle, square."
  },
  {
    category: "PATTERN",
    title: "Complete the rhythm",
    hint: "Follow both shape and color.",
    sequence: ["diamond","diamond","ring","diamond","diamond","?"],
    answers: ["ring","square","triangle","diamond"],
    correct: 0,
    explanation: "Every third shape is a ring."
  },
  {
    category: "LOGIC",
    title: "Which piece is missing?",
    hint: "Look at how each row changes.",
    sequence: ["triangle","circle","square","circle","square","triangle","square","triangle","?"],
    answers: ["circle","ring","square","triangle"],
    correct: 0,
    explanation: "Each row contains one triangle, one circle, and one square."
  },
  {
    category: "SPATIAL",
    title: "Spot the rotation",
    hint: "Imagine the shape turning clockwise.",
    sequence: ["cross","diamond","cross","diamond","cross","?"],
    answers: ["diamond","ring","circle","triangle"],
    correct: 0,
    explanation: "The two forms alternate as the sequence advances."
  },
  {
    category: "PATTERN",
    title: "Find the sixth tile",
    hint: "Two patterns are happening at once.",
    sequence: ["ring","circle","ring","circle","ring","?"],
    answers: ["circle","square","diamond","ring"],
    correct: 0,
    explanation: "The sequence simply alternates ring and circle."
  },
  {
    category: "LOGIC",
    title: "Finish the set",
    hint: "No shape should appear twice in a row.",
    sequence: ["triangle","square","diamond","triangle","square","?"],
    answers: ["diamond","square","triangle","circle"],
    correct: 0,
    explanation: "Triangle, square, diamond repeats in groups of three."
  },
  {
    category: "FINAL",
    title: "One last pattern",
    hint: "Ignore the distraction. Trust the order.",
    sequence: ["circle","diamond","square","circle","diamond","?"],
    answers: ["square","ring","circle","triangle"],
    correct: 0,
    explanation: "Circle, diamond, square repeats."
  }
];

const state = {
  index: 0,
  correct: 0,
  answered: false,
  timeLeft: 20,
  timer: null,
  responseTimes: [],
  runStartedAt: 0
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const screens = {
  home: $("#homeScreen"),
  game: $("#gameScreen"),
  result: $("#resultScreen")
};

function showScreen(name) {
  Object.values(screens).forEach(screen => screen.classList.remove("is-active"));
  screens[name].classList.add("is-active");
  $("#bottomNav").style.display = name === "home" ? "flex" : "none";
  window.scrollTo({top: 0, behavior: "smooth"});
}

function shapeMarkup(shape) {
  if (shape === "?") return '<span aria-hidden="true">?</span>';
  return `<span class="shape ${shape}" aria-hidden="true"></span>`;
}

function startRun() {
  state.index = 0;
  state.correct = 0;
  state.answered = false;
  state.responseTimes = [];
  state.runStartedAt = Date.now();
  showScreen("game");
  renderPuzzle();
}

function renderPuzzle() {
  clearInterval(state.timer);
  state.answered = false;
  state.timeLeft = 20;
  const p = puzzles[state.index];

  $("#questionCounter").textContent = `${state.index + 1} of ${puzzles.length}`;
  $("#gameCategory").textContent = p.category;
  $("#questionTitle").textContent = p.title;
  $("#questionHint").textContent = p.hint;
  $("#progressBar").style.width = `${((state.index + 1) / puzzles.length) * 100}%`;
  $("#timerText").textContent = state.timeLeft;

  $("#sequenceGrid").innerHTML = p.sequence.map(shape =>
    `<div class="tile ${shape === "?" ? "question" : ""}">${shapeMarkup(shape)}</div>`
  ).join("");

  $("#answersGrid").innerHTML = p.answers.map((answer, i) =>
    `<button class="answer-button" data-answer="${i}" aria-label="Answer ${i + 1}">
      ${shapeMarkup(answer)}
    </button>`
  ).join("");

  $$(".answer-button").forEach(btn => {
    btn.addEventListener("click", () => chooseAnswer(Number(btn.dataset.answer)));
  });

  $("#feedbackCard").classList.remove("show", "bad");
  $("#feedbackIcon").textContent = "✓";

  state.timer = setInterval(() => {
    if (state.answered) return;
    state.timeLeft -= 1;
    $("#timerText").textContent = Math.max(0, state.timeLeft);
    if (state.timeLeft <= 0) {
      clearInterval(state.timer);
      chooseAnswer(-1);
    }
  }, 1000);
}

function chooseAnswer(index) {
  if (state.answered) return;
  state.answered = true;
  clearInterval(state.timer);

  const p = puzzles[state.index];
  const buttons = $$(".answer-button");
  const isCorrect = index === p.correct;

  if (index >= 0 && buttons[index]) buttons[index].classList.add(isCorrect ? "correct" : "wrong");
  if (!isCorrect && buttons[p.correct]) buttons[p.correct].classList.add("correct");

  state.responseTimes.push(20 - state.timeLeft);

  if (isCorrect) {
    state.correct += 1;
    $("#feedbackTitle").textContent = "Exactly right";
    $("#feedbackText").textContent = p.explanation;
    $("#feedbackIcon").textContent = "✓";
  } else {
    $("#feedbackCard").classList.add("bad");
    $("#feedbackTitle").textContent = state.timeLeft <= 0 ? "Time’s up" : "Nearly";
    $("#feedbackText").textContent = p.explanation;
    $("#feedbackIcon").textContent = "↗";
  }

  $("#nextButton").innerHTML = state.index === puzzles.length - 1 ? 'See score <span>→</span>' : 'Next <span>→</span>';
  setTimeout(() => $("#feedbackCard").classList.add("show"), 130);
}

function nextPuzzle() {
  if (!state.answered) return;
  if (state.index < puzzles.length - 1) {
    state.index += 1;
    renderPuzzle();
  } else {
    finishRun();
  }
}

function finishRun() {
  clearInterval(state.timer);
  const accuracy = state.correct / puzzles.length;
  const avgTime = state.responseTimes.length
    ? state.responseTimes.reduce((a,b) => a + b, 0) / state.responseTimes.length
    : 20;
  const speedBonus = Math.max(0, Math.round((20 - avgTime) * 4));
  const score = Math.min(999, Math.round(510 + state.correct * 48 + speedBonus));
  const percentile = Math.max(2, Math.min(65, Math.round(54 - accuracy * 48 - speedBonus / 13)));

  $("#finalScore").textContent = score;
  $("#scoreDelta").textContent = score >= 820 ? "↑ strong run today" : "keep building";
  $("#rankText").textContent = `Top ${percentile}%`;
  $("#correctText").textContent = `${state.correct} / ${puzzles.length} correct`;

  const pattern = Math.min(99, Math.round(58 + accuracy * 37));
  const logic = Math.min(99, Math.round(54 + accuracy * 32 + speedBonus / 5));
  const speed = Math.min(99, Math.max(45, Math.round(97 - avgTime * 2.2)));

  $("#patternScore").textContent = pattern;
  $("#logicScore").textContent = logic;
  $("#speedScore").textContent = speed;

  localStorage.setItem("iqgames-best", String(Math.max(score, Number(localStorage.getItem("iqgames-best") || 0))));
  $("#homeBestScore").textContent = Math.max(score, Number(localStorage.getItem("iqgames-best") || 0));

  showScreen("result");

  requestAnimationFrame(() => {
    setTimeout(() => {
      $("#patternBar").style.width = pattern + "%";
      $("#logicBar").style.width = logic + "%";
      $("#speedBar").style.width = speed + "%";
    }, 250);
  });
}

function goHome() {
  clearInterval(state.timer);
  showScreen("home");
  $("#feedbackCard").classList.remove("show");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

async function shareScore() {
  const score = $("#finalScore").textContent;
  const text = `I scored ${score} on today’s IQ Games challenge. Can you beat me?`;
  if (navigator.share) {
    try { await navigator.share({title: "IQ Games", text}); }
    catch (_) {}
  } else if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    showToast("Score copied to clipboard");
  } else {
    showToast(text);
  }
}

$("#startRunButton").addEventListener("click", startRun);
$("#nextButton").addEventListener("click", nextPuzzle);
$("#exitGameButton").addEventListener("click", goHome);
$("#homeButton").addEventListener("click", goHome);
$("#brandButton").addEventListener("click", goHome);
$("#shareButton").addEventListener("click", shareScore);
$("#practiceButton").addEventListener("click", () => { showToast("Practice mode is next ✦"); });
$$(".skill-card").forEach(card => card.addEventListener("click", () => {
  showToast(`${card.dataset.skill} practice is coming next`);
}));
$$(".nav-item").forEach(item => item.addEventListener("click", () => {
  if (item.dataset.nav === "home") return;
  showToast(`${item.dataset.nav[0].toUpperCase() + item.dataset.nav.slice(1)} is coming next`);
}));

const storedBest = Number(localStorage.getItem("iqgames-best") || 842);
$("#homeBestScore").textContent = storedBest;