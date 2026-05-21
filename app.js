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
    success: (_clue, answer) => `Teisingai! Toliau eina ${answer}.`,
    miss: (_clue, answer) => `Beveik! Čia tinka ${answer}.`
  },
  2: {
    choiceCount: 4,
    prompt: "Kokios 3 raidės eina toliau?",
    success: (_clue, answer) => `Puiku! Toliau eina ${answer}.`,
    miss: (_clue, answer) => `Dar truputį. Teisinga seka: ${answer}.`
  },
  3: {
    choiceCount: 4,
    prompt: "Kokia visa 5 raidžių seka?",
    success: (_clue, answer) => `Šaunu! Visa seka: ${answer}.`,
    miss: (_clue, answer) => `Gera pastanga. Teisinga seka: ${answer}.`
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
let clueText = "";
let currentRevealCards = [];
let locked = false;
let nextQuestionTimer = null;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSequence(start, length) {
  return alphabet.slice(start, start + length);
}

function getSequenceLabel(start, length) {
  return getSequence(start, length).join(" ");
}

function buildSingleLetterChoices(answerIndex, count) {
  const pool = new Set([alphabet[answerIndex]]);
  const spread = count + 3;

  while (pool.size < count) {
    const offset = randomBetween(-spread, spread);
    const candidateIndex = Math.max(0, Math.min(alphabet.length - 1, answerIndex + offset));
    pool.add(alphabet[candidateIndex]);
  }

  return shuffle([...pool]);
}

function buildSequenceChoices(answerStart, sequenceLength, count) {
  const maxStart = alphabet.length - sequenceLength;
  const pool = new Set([getSequenceLabel(answerStart, sequenceLength)]);

  while (pool.size < count) {
    const offset = randomBetween(-4, 4);
    const candidateStart = Math.max(0, Math.min(maxStart, answerStart + offset));
    pool.add(getSequenceLabel(candidateStart, sequenceLength));
  }

  return shuffle([...pool]);
}

function makeQuestion() {
  if (level === 1) {
    currentIndex = randomBetween(2, alphabet.length - 1);
    currentAnswer = alphabet[currentIndex];
    clueText = alphabet[currentIndex - 1];
    return {
      cards: [...alphabet.slice(Math.max(0, currentIndex - 4), currentIndex), "?"],
      revealCards: [...alphabet.slice(Math.max(0, currentIndex - 4), currentIndex), currentAnswer],
      choices: buildSingleLetterChoices(currentIndex, levels[level].choiceCount)
    };
  }

  if (level === 2) {
    const start = randomBetween(0, alphabet.length - 4);
    currentIndex = start;
    clueText = alphabet[start];
    currentAnswer = getSequenceLabel(start + 1, 3);
    return {
      cards: [alphabet[start], "?", "?", "?"],
      revealCards: [alphabet[start], ...getSequence(start + 1, 3)],
      choices: buildSequenceChoices(start + 1, 3, levels[level].choiceCount)
    };
  }

  const start = randomBetween(0, alphabet.length - 5);
  const visibleOffset = randomBetween(0, 4);
  const sequence = getSequence(start, 5);
  currentIndex = start + visibleOffset;
  clueText = alphabet[currentIndex];
  currentAnswer = sequence.join(" ");

  return {
    cards: sequence.map((letter, index) => (index === visibleOffset ? letter : "?")),
    revealCards: sequence,
    choices: buildSequenceChoices(start, 5, levels[level].choiceCount)
  };
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

  const question = makeQuestion();
  currentRevealCards = question.revealCards;

  promptRow.innerHTML = "";
  question.cards.forEach((letter) => {
    const card = document.createElement("div");
    card.className = `letter-card${letter === "?" ? " blank" : ""}`;
    card.textContent = letter;
    promptRow.append(card);
  });

  choices.innerHTML = "";
  question.choices.forEach((answer) => {
    const button = document.createElement("button");
    button.className = `choice${answer.includes(" ") ? " sequence" : ""}`;
    button.type = "button";
    button.textContent = answer;
    button.setAttribute("aria-label", `Pasirinkti ${answer}`);
    button.addEventListener("click", () => chooseAnswer(button, answer));
    choices.append(button);
  });

  renderLevels();
  renderAlphabetStrip();
}

function revealAnswerCards() {
  promptRow.innerHTML = "";
  currentRevealCards.forEach((letter) => {
    const card = document.createElement("div");
    card.className = "letter-card revealed";
    card.textContent = letter;
    promptRow.append(card);
  });
}

function chooseAnswer(button, answer) {
  if (locked) return;
  locked = true;

  const buttons = [...choices.querySelectorAll("button")];
  buttons.forEach((choice) => {
    choice.disabled = true;
    if (choice.textContent === currentAnswer) {
      choice.classList.add("correct");
    }
  });

  if (answer === currentAnswer) {
    score += level;
    streak += 1;
    feedback.textContent = levels[level].success(clueText, currentAnswer);
    feedback.classList.add("good");
    revealAnswerCards();
  } else {
    streak = 0;
    button.classList.add("wrong");
    feedback.textContent = levels[level].miss(clueText, currentAnswer);
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
