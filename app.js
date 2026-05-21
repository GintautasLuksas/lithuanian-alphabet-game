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
    prompt: "Kuri raidė eina toliau?",
    success: (answer) => `Teisingai! Toliau eina ${answer}.`,
    miss: (answer) => `Beveik! Čia tinka ${answer}.`
  },
  2: {
    prompt: "Paspausk 3 kitas raides iš eilės.",
    success: (answer) => `Puiku! Toliau eina ${answer}.`,
    miss: (answer) => `Ieškok raidės ${answer}.`
  },
  3: {
    prompt: "Užpildyk 5 raidžių seką po vieną raidę.",
    success: (answer) => `Šaunu! Visa seka: ${answer}.`,
    miss: (answer) => `Ieškok raidės ${answer}.`
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
let currentIndex = 0;
let currentQuestion = null;
let locked = false;
let nextQuestionTimer = null;
let wrongTimer = null;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSequence(start, length) {
  return alphabet.slice(start, start + length);
}

function buildLetterChoices(answerIndexes, count) {
  const pool = new Set(answerIndexes.map((index) => alphabet[index]));
  const center = answerIndexes[0];

  while (pool.size < count) {
    const offset = randomBetween(-6, 6);
    const candidateIndex = Math.max(0, Math.min(alphabet.length - 1, center + offset));
    pool.add(alphabet[candidateIndex]);
  }

  return shuffle([...pool]);
}

function makeQuestion() {
  if (level === 1) {
    const answerIndex = randomBetween(2, alphabet.length - 1);
    const cards = [...alphabet.slice(Math.max(0, answerIndex - 4), answerIndex), "?"];

    return {
      answerIndexes: [answerIndex],
      cards,
      choices: buildLetterChoices([answerIndex], 4),
      cursor: 0,
      revealCards: [...cards.slice(0, -1), alphabet[answerIndex]],
      targetText: alphabet[answerIndex]
    };
  }

  if (level === 2) {
    const start = randomBetween(0, alphabet.length - 4);
    const answerIndexes = [start + 1, start + 2, start + 3];

    return {
      answerIndexes,
      cards: [alphabet[start], "?", "?", "?"],
      choices: buildLetterChoices(answerIndexes, 6),
      cursor: 0,
      revealCards: [alphabet[start], ...answerIndexes.map((index) => alphabet[index])],
      targetText: answerIndexes.map((index) => alphabet[index]).join(" ")
    };
  }

  const start = randomBetween(0, alphabet.length - 5);
  const visibleOffset = randomBetween(0, 4);
  const sequence = getSequence(start, 5);
  const answerIndexes = sequence
    .map((_letter, index) => start + index)
    .filter((index) => index !== start + visibleOffset);

  return {
    answerIndexes,
    cards: sequence.map((letter, index) => (index === visibleOffset ? letter : "?")),
    choices: buildLetterChoices(answerIndexes, 7),
    cursor: 0,
    revealCards: sequence,
    targetText: sequence.join(" ")
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

function renderCards(cards) {
  promptRow.innerHTML = "";
  cards.forEach((letter) => {
    const card = document.createElement("div");
    card.className = `letter-card${letter === "?" ? " blank" : ""}`;
    card.textContent = letter;
    promptRow.append(card);
  });
}

function renderChoices() {
  choices.innerHTML = "";
  currentQuestion.choices.forEach((letter) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = letter;
    button.setAttribute("aria-label", `Pasirinkti raidę ${letter}`);
    button.addEventListener("click", () => chooseAnswer(button, letter));
    choices.append(button);
  });
}

function renderQuestion() {
  window.clearTimeout(nextQuestionTimer);
  window.clearTimeout(wrongTimer);
  locked = false;
  feedback.textContent = "";
  feedback.className = "feedback";
  questionText.textContent = levels[level].prompt;
  currentQuestion = makeQuestion();
  currentIndex = currentQuestion.answerIndexes[0];

  renderCards(currentQuestion.cards);
  renderChoices();
  renderLevels();
  renderAlphabetStrip();
}

function revealNextLetter(letter) {
  const blankIndex = currentQuestion.cards.indexOf("?");
  if (blankIndex === -1) return;

  currentQuestion.cards[blankIndex] = letter;
  const card = promptRow.children[blankIndex];
  card.className = "letter-card revealed";
  card.textContent = letter;
}

function revealFullAnswer() {
  promptRow.innerHTML = "";
  currentQuestion.revealCards.forEach((letter) => {
    const card = document.createElement("div");
    card.className = "letter-card revealed";
    card.textContent = letter;
    promptRow.append(card);
  });
}

function finishQuestion() {
  locked = true;
  score += level;
  streak += 1;
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  feedback.textContent = levels[level].success(currentQuestion.targetText);
  feedback.classList.add("good");

  if (level === 1) {
    revealFullAnswer();
  }

  choices.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  nextQuestionTimer = window.setTimeout(renderQuestion, 850);
}

function showMistake(button, expectedLetter) {
  streak = 0;
  streakEl.textContent = streak;
  feedback.textContent = levels[level].miss(expectedLetter);
  feedback.className = "feedback try";
  button.classList.add("wrong");
  window.clearTimeout(wrongTimer);
  wrongTimer = window.setTimeout(() => {
    button.classList.remove("wrong");
  }, 450);
}

function chooseAnswer(button, letter) {
  if (locked) return;

  const expectedIndex = currentQuestion.answerIndexes[currentQuestion.cursor];
  const expectedLetter = alphabet[expectedIndex];

  if (letter !== expectedLetter) {
    showMistake(button, expectedLetter);
    return;
  }

  revealNextLetter(letter);
  currentQuestion.cursor += 1;
  currentIndex = currentQuestion.answerIndexes[currentQuestion.cursor] ?? expectedIndex;
  renderAlphabetStrip();

  if (currentQuestion.cursor === currentQuestion.answerIndexes.length) {
    finishQuestion();
    return;
  }

  feedback.textContent = `Taip! Dabar rask ${alphabet[currentQuestion.answerIndexes[currentQuestion.cursor]]}.`;
  feedback.className = "feedback good";
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
