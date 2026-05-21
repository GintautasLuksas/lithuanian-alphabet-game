const alphabet = [
  "A",
  "Ą",
  "B",
  "C",
  "Č",
  "D",
  "E",
  "Ę",
  "Ė",
  "F",
  "G",
  "H",
  "I",
  "Į",
  "Y",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "R",
  "S",
  "Š",
  "T",
  "U",
  "Ų",
  "Ū",
  "V",
  "Z",
  "Ž"
];

const levels = {
  1: {
    choiceCount: 4,
    prompt: "Kuri raidė eina toliau?",
    success: (before, answer) => `Teisingai! Po ${before} eina ${answer}.`,
    miss: (before, answer) => `Beveik! Po ${before} eina ${answer}.`
  },
  2: {
    choiceCount: 5,
    prompt: "Kuri raidė pasislėpė viduryje?",
    success: (_before, answer) => `Puiku! Trūkstama raidė yra ${answer}.`,
    miss: (_before, answer) => `Dar truputį. Čia turėjo būti ${answer}.`
  },
  3: {
    choiceCount: 6,
    prompt: "Kuri raidė tinka prie šios mažos užuominos?",
    success: (before, answer) => `Šaunu! Po ${before} eina ${answer}.`,
    miss: (before, answer) => `Gera pastanga. Po ${before} eina ${answer}.`
  }
};

const promptRow = document.querySelector("#promptRow");
const choices = document.querySelector("#choices");
const feedback = document.querySelector("#feedback");
const resetButton = document.querySelector("#resetButton");
const scoreEl = document.querySelector("#score");
const streakEl = document.querySelector("#streak");
const alphabetStrip = document.querySelector("#alphabetStrip");
const questionText = document.querySelector("#questionText");
const levelButtons = [...document.querySelectorAll(".level-button")];

let score = 0;
let streak = 0;
let level = 1;
let currentAnswer = "";
let currentIndex = 0;
let previousLetter = "";
let locked = false;
let nextQuestionTimer = null;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildChoices(answerIndex, count) {
  const answer = alphabet[answerIndex];
  const pool = new Set([answer]);
  const spread = count + 3;

  while (pool.size < count) {
    const offset = randomBetween(-spread, spread);
    const candidateIndex = Math.max(0, Math.min(alphabet.length - 1, answerIndex + offset));
    pool.add(alphabet[candidateIndex]);
  }

  return shuffle([...pool]);
}

function makeQuestion() {
  if (level === 1) {
    currentIndex = randomBetween(2, alphabet.length - 1);
    currentAnswer = alphabet[currentIndex];
    previousLetter = alphabet[currentIndex - 1];
    return [...alphabet.slice(Math.max(0, currentIndex - 4), currentIndex), "?"];
  }

  if (level === 2) {
    const start = randomBetween(0, alphabet.length - 5);
    const hiddenOffset = randomBetween(1, 3);
    currentIndex = start + hiddenOffset;
    currentAnswer = alphabet[currentIndex];
    previousLetter = alphabet[currentIndex - 1];
    return alphabet.slice(start, start + 5).map((letter, index) => (
      index === hiddenOffset ? "?" : letter
    ));
  }

  currentIndex = randomBetween(1, alphabet.length - 1);
  currentAnswer = alphabet[currentIndex];
  previousLetter = alphabet[currentIndex - 1];
  return [previousLetter, "?"];
}

function renderAlphabetStrip() {
  alphabetStrip.innerHTML = "";
  alphabet.forEach((letter, index) => {
    const item = document.createElement("span");
    item.className = `mini-letter${index === currentIndex ? " active" : ""}`;
    item.textContent = letter;
    alphabetStrip.append(item);
  });
}

function renderLevels() {
  levelButtons.forEach((button) => {
    const isActive = Number(button.dataset.level) === level;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderQuestion() {
  window.clearTimeout(nextQuestionTimer);
  locked = false;
  feedback.textContent = "";
  feedback.className = "feedback";
  questionText.textContent = levels[level].prompt;

  promptRow.innerHTML = "";
  makeQuestion().forEach((letter) => {
    const card = document.createElement("div");
    card.className = `letter-card${letter === "?" ? " blank" : ""}`;
    card.textContent = letter;
    promptRow.append(card);
  });

  choices.innerHTML = "";
  buildChoices(currentIndex, levels[level].choiceCount).forEach((letter) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = letter;
    button.setAttribute("aria-label", `Pasirinkti raidę ${letter}`);
    button.addEventListener("click", () => chooseLetter(button, letter));
    choices.append(button);
  });

  renderLevels();
  renderAlphabetStrip();
}

function chooseLetter(button, letter) {
  if (locked) return;
  locked = true;

  const buttons = [...choices.querySelectorAll("button")];
  buttons.forEach((choice) => {
    choice.disabled = true;
    if (choice.textContent === currentAnswer) {
      choice.classList.add("correct");
    }
  });

  if (letter === currentAnswer) {
    score += level;
    streak += 1;
    feedback.textContent = levels[level].success(previousLetter, currentAnswer);
    feedback.classList.add("good");
  } else {
    streak = 0;
    button.classList.add("wrong");
    feedback.textContent = levels[level].miss(previousLetter, currentAnswer);
    feedback.classList.add("try");
  }

  scoreEl.textContent = score;
  streakEl.textContent = streak;
  nextQuestionTimer = window.setTimeout(renderQuestion, 650);
}

levelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    level = Number(button.dataset.level);
    renderQuestion();
  });
});

resetButton.addEventListener("click", () => {
  score = 0;
  streak = 0;
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  renderQuestion();
});

renderQuestion();
