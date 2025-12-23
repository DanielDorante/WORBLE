// Game State
let currentRow = 0;
let currentTile = 0;
let currentGuess = "";
let gameOver = false;
let targetWord = "";
let currentStreak = parseInt(localStorage.getItem("wordleStreak")) || 0;
let bestStreak = parseInt(localStorage.getItem("wordleBestStreak")) || 0;

// Keyboard layout
const keyboard = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
];

// Initialize game
function init() {
  if (WORDS.length === 0) {
    showMessage("Please add words to words.js to play!");
    return;
  }

  // Select random word
  targetWord = WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();
  console.log("Target word:", targetWord); // For testing

  createBoard();
  createKeyboard();
  updateStreakDisplay();

  // Add event listeners
  document.addEventListener("keydown", handleKeyPress);
  document.getElementById("restartBtn").addEventListener("click", restartGame);
}

// Create game board
function createBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  for (let i = 0; i < 6; i++) {
    const row = document.createElement("div");
    row.className = "row";

    for (let j = 0; j < 5; j++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.id = `tile-${i}-${j}`;
      row.appendChild(tile);
    }

    board.appendChild(row);
  }
}

// Create keyboard
function createKeyboard() {
  const keyboardElement = document.getElementById("keyboard");
  keyboardElement.innerHTML = "";

  keyboard.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "keyboard-row";

    row.forEach((key) => {
      const keyElement = document.createElement("button");
      keyElement.className = "key";
      keyElement.textContent = key === "BACKSPACE" ? "⌫" : key;
      keyElement.dataset.key = key;

      if (key === "ENTER" || key === "BACKSPACE") {
        keyElement.classList.add("wide");
      }

      keyElement.addEventListener("click", () => handleKeyClick(key));
      rowElement.appendChild(keyElement);
    });

    keyboardElement.appendChild(rowElement);
  });
}

// Handle keyboard clicks
function handleKeyClick(key) {
  if (gameOver) return;

  if (key === "ENTER") {
    submitGuess();
  } else if (key === "BACKSPACE") {
    deleteLetter();
  } else {
    addLetter(key);
  }
}

// Handle physical keyboard
function handleKeyPress(e) {
  if (gameOver) return;

  const key = e.key.toUpperCase();

  if (key === "ENTER") {
    submitGuess();
  } else if (key === "BACKSPACE") {
    deleteLetter();
  } else if (/^[A-Z]$/.test(key)) {
    addLetter(key);
  }
}

// Add letter to current guess
function addLetter(letter) {
  if (currentTile < 5) {
    const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
    tile.textContent = letter;
    tile.classList.add("filled");
    currentGuess += letter.toLowerCase();
    currentTile++;
  }
}

// Delete last letter
function deleteLetter() {
  if (currentTile > 0) {
    currentTile--;
    const tile = document.getElementById(`tile-${currentRow}-${currentTile}`);
    tile.textContent = "";
    tile.classList.remove("filled");
    currentGuess = currentGuess.slice(0, -1);
  }
}

// Submit guess
function submitGuess() {
  if (currentTile !== 5) {
    showMessage("Not enough letters");
    shakeTiles();
    return;
  }

  // Easter egg for LILLY
  if (currentGuess === "lilly") {
    handleLillyEasterEgg();
    return;
  }

  if (WORDS.length > 0 && !WORDS.includes(currentGuess)) {
    showMessage("Not in word list");
    shakeTiles();
    return;
  }

  checkGuess();
}

// Check guess against target word
function checkGuess() {
  const guess = currentGuess;
  const letterCount = {};
  const result = Array(5).fill("absent");

  // Count letters in target word
  for (let letter of targetWord) {
    letterCount[letter] = (letterCount[letter] || 0) + 1;
  }

  // First pass: mark correct letters
  for (let i = 0; i < 5; i++) {
    if (guess[i] === targetWord[i]) {
      result[i] = "correct";
      letterCount[guess[i]]--;
    }
  }

  // Second pass: mark present letters
  for (let i = 0; i < 5; i++) {
    if (result[i] !== "correct" && letterCount[guess[i]] > 0) {
      result[i] = "present";
      letterCount[guess[i]]--;
    }
  }

  // Animate tiles
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      tile.classList.add(result[i]);
      updateKeyboard(guess[i].toUpperCase(), result[i]);
    }, i * 300);
  }

  // Check win/lose after animations
  setTimeout(() => {
    if (guess === targetWord) {
      gameOver = true;
      currentStreak++;
      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
        localStorage.setItem("wordleBestStreak", bestStreak);
      }
      localStorage.setItem("wordleStreak", currentStreak);
      updateStreakDisplay();
      showMessage("Excellent!", "win");
      showRestartButton();
    } else if (currentRow === 5) {
      gameOver = true;
      currentStreak = 0;
      localStorage.setItem("wordleStreak", currentStreak);
      updateStreakDisplay();
      showMessage(
        `Game Over! The word was ${targetWord.toUpperCase()}`,
        "lose"
      );
      showRestartButton();
    } else {
      currentRow++;
      currentTile = 0;
      currentGuess = "";
    }
  }, 1500);
}

// Update keyboard colors
function updateKeyboard(letter, status) {
  const key = document.querySelector(`[data-key="${letter}"]`);
  if (!key) return;

  const currentStatus = key.classList.contains("correct")
    ? "correct"
    : key.classList.contains("present")
    ? "present"
    : key.classList.contains("absent")
    ? "absent"
    : "";

  // Only update if new status is better
  if (
    status === "correct" ||
    (status === "present" && currentStatus !== "correct") ||
    (status === "absent" && !currentStatus)
  ) {
    key.classList.remove("correct", "present", "absent");
    key.classList.add(status);
  }
}

// Show message
function showMessage(text, type = "") {
  const messageElement = document.getElementById("message");
  messageElement.textContent = text;
  messageElement.className = "message show";

  if (type) {
    messageElement.classList.add(type);
  }

  setTimeout(() => {
    messageElement.className = "message";
  }, 5000);
}

// Shake animation for invalid guesses
function shakeTiles() {
  const tiles = document.querySelectorAll(
    `#tile-${currentRow}-0, #tile-${currentRow}-1, #tile-${currentRow}-2, #tile-${currentRow}-3, #tile-${currentRow}-4`
  );
  tiles.forEach((tile) => {
    tile.style.animation = "shake 0.3s";
    setTimeout(() => {
      tile.style.animation = "";
    }, 300);
  });
}

// Easter egg for LILLY
function handleLillyEasterEgg() {
  // Mark all tiles as correct
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      const tile = document.getElementById(`tile-${currentRow}-${i}`);
      tile.classList.add("correct");
      updateKeyboard(currentGuess[i].toUpperCase(), "correct");
    }, i * 300);
  }

  // Show special message and win
  setTimeout(() => {
    gameOver = true;
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
      localStorage.setItem("wordleBestStreak", bestStreak);
    }
    localStorage.setItem("wordleStreak", currentStreak);
    updateStreakDisplay();
    showMessage(
      `The word was actually ${targetWord.toUpperCase()} but Lilly is better`,
      "win"
    );
    showRestartButton();
  }, 1500);
}

// Update streak display
function updateStreakDisplay() {
  const streakElement = document.getElementById("streak");
  streakElement.textContent = `Streak: ${currentStreak}`;
  if (bestStreak > 0 && bestStreak > currentStreak) {
    streakElement.textContent += ` (Best: ${bestStreak})`;
  }
}

// Show restart button
function showRestartButton() {
  setTimeout(() => {
    const restartBtn = document.getElementById("restartBtn");
    restartBtn.style.display = "block";
  }, 2000);
}

// Restart game
function restartGame() {
  // Reset game state
  currentRow = 0;
  currentTile = 0;
  currentGuess = "";
  gameOver = false;

  // Select new word
  targetWord = WORDS[Math.floor(Math.random() * WORDS.length)].toLowerCase();
  console.log("New target word:", targetWord);

  // Clear board
  const board = document.getElementById("board");
  board.innerHTML = "";
  createBoard();

  // Reset keyboard colors
  const keys = document.querySelectorAll(".key");
  keys.forEach((key) => {
    key.classList.remove("correct", "present", "absent");
  });

  // Hide restart button
  document.getElementById("restartBtn").style.display = "none";

  // Clear message immediately
  const messageElement = document.getElementById("message");
  messageElement.className = "message";
  messageElement.textContent = "";
}

// Add shake animation to CSS
const style = document.createElement("style");
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Start game when page loads
window.addEventListener("DOMContentLoaded", init);
