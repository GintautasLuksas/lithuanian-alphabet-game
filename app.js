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

const promptRow = document.querySelector("#promptRow");
const choices = document.querySelector("#choices");
const feedback = document.querySelector("#feedback");
const nextButton = document.querySelector("#nextButton");
const resetButton = document.querySelector("#resetButton");
const hearButton = document.querySelector("#hearButton");
const scoreEl = document.querySelector("#score");
const streakEl = document.querySelector("#streak");
const alphabetStrip = document.querySelector("#alphabetStrip");

let score = 0;
let streak = 0;
let currentAnswer = "";
let currentIndex = 0;
let locked = false;

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pickQuestionIndex() {
  return Math.floor(Math.random() * (alphabet.length - 3)) + 2;
}

function buildChoices(answerIndex) {
  const answer = alphabet[answerIndex];
  const pool = new Set([answer]);

  while (pool.size < 4) {
    const offset = Math.floor(Math.random() * 9) - 4;
    const candidateIndex = Math.max(0, Math.min(alphabet.length - 1, answerIndex + offset));
    pool.add(alphabet[candidateIndex]);
  }

  return shuffle([...pool]);
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

function renderQuestion() {
  locked = false;
  currentIndex = pickQuestionIndex();
  currentAnswer = alphabet[currentIndex];
  feedback.textContent = "";
  feedback.className = "feedback";

  const visibleLetters = alphabet.slice(currentIndex - 4, currentIndex).filter(Boolean);
  promptRow.innerHTML = "";
  [...visibleLetters, "?"].forEach((letter) => {
    const card = document.createElement("div");
    card.className = `letter-card${letter === "?" ? " blank" : ""}`;
    card.textContent = letter;
    promptRow.append(card);
  });

  choices.innerHTML = "";
  buildChoices(currentIndex).forEach((letter) => {
    const button = document.createElement("button");
    button.className = "choice";
    button.type = "button";
    button.textContent = letter;
    button.setAttribute("aria-label", `Pasirinkti raidę ${letter}`);
    button.addEventListener("click", () => chooseLetter(button, letter));
    choices.append(button);
  });

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
    score += 1;
    streak += 1;
    feedback.textContent = `Teisingai! Po ${alphabet[currentIndex - 1]} eina ${currentAnswer}.`;
    feedback.classList.add("good");
    speak(currentAnswer);
  } else {
    streak = 0;
    button.classList.add("wrong");
    feedback.textContent = `Beveik! Po ${alphabet[currentIndex - 1]} eina ${currentAnswer}.`;
    feedback.classList.add("try");
  }

  scoreEl.textContent = score;
  streakEl.textContent = streak;
}

function speak(letter) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(letter);
  utterance.lang = "lt-LT";
  utterance.rate = 0.72;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

nextButton.addEventListener("click", renderQuestion);

resetButton.addEventListener("click", () => {
  score = 0;
  streak = 0;
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  renderQuestion();
});

hearButton.addEventListener("click", () => speak(currentAnswer));

renderQuestion();
