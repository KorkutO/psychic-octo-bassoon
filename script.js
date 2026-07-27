import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js";

const fallbackPuzzles = [
  {
    title: "Scholar's finish",
    description: "White to move. The king is still in the center.",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["h5f7"],
    rating: 700,
    theme: "Mate",
  },
  {
    title: "Quiet queen mate",
    description: "White to move. Use the open back rank.",
    fen: "7k/6pp/8/3Q4/8/8/6PP/6K1 w - - 0 1",
    solution: ["d5d8"],
    rating: 750,
    theme: "Back rank",
  },
  {
    title: "Rook lift",
    description: "White to move. One rook move ends the game.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution: ["a1a8"],
    rating: 800,
    theme: "Rook mate",
  },
  {
    title: "Dark-square net",
    description: "Black to move. The queen enters on the first rank.",
    fen: "6k1/5ppp/8/2b5/8/8/4qPPP/6K1 b - - 0 1",
    solution: ["e2e1"],
    rating: 850,
    theme: "Queen mate",
  },
  {
    title: "Back-rank file",
    description: "Black to move. The rook uses the empty file.",
    fen: "r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",
    solution: ["a8a1"],
    rating: 900,
    theme: "Rook mate",
  },
];

const pieces = {
  wp: "\u265f",
  wn: "\u265e",
  wb: "\u265d",
  wr: "\u265c",
  wq: "\u265b",
  wk: "\u265a",
  bp: "\u265f",
  bn: "\u265e",
  bb: "\u265d",
  br: "\u265c",
  bq: "\u265b",
  bk: "\u265a",
};

const pieceNames = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

const ignoredThemes = new Set([
  "advancedPawn",
  "advantage",
  "crushing",
  "equality",
  "master",
  "masterVsMaster",
  "opening",
  "middlegame",
  "endgame",
  "short",
  "long",
  "veryLong",
  "oneMove",
  "defensiveMove",
  "quietMove",
]);

const preferredThemes = [
  "mateIn1",
  "mateIn2",
  "mateIn3",
  "mateIn4",
  "mateIn5OrMore",
  "fork",
  "pin",
  "skewer",
  "discoveredAttack",
  "doubleCheck",
  "sacrifice",
  "deflection",
  "attraction",
  "interference",
  "clearance",
  "backRankMate",
  "smotheredMate",
  "promotion",
  "underPromotion",
  "trappedPiece",
  "hangingPiece",
  "capturingDefender",
  "removeDefender",
  "mate",
];

const boardEl = document.querySelector("#board");
const titleEl = document.querySelector("#puzzle-title");
const descriptionEl = document.querySelector("#puzzle-description");
const ratingEl = document.querySelector("#puzzle-rating");
const themeEl = document.querySelector("#puzzle-theme");
const sideEl = document.querySelector("#puzzle-side-to-move");
const counterEl = document.querySelector("#puzzle-counter");
const progressEl = document.querySelector("#puzzle-progress-fill");
const statusEl = document.querySelector("#status");
const nextButton = document.querySelector("#next-puzzle");
const resetButton = document.querySelector("#reset-puzzle");
const flipButton = document.querySelector("#flip-board");
const soundButton = document.querySelector("#sound-toggle");

let puzzles = fallbackPuzzles;
let puzzleIndex = 0;
let chess = null;
let selectedSquare = null;
let legalTargets = [];
let activeSolution = [];
let solutionIndex = 0;
let orientation = "white";
let startingSide = "w";
let lastMove = null;
let soundEnabled = true;
let audioContext = null;

function currentPuzzle() {
  return puzzles[puzzleIndex];
}

function sideName(color) {
  return color === "w" ? "White" : "Black";
}

function humanizeTheme(theme) {
  if (!theme) return "Tactics";
  return theme
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\bIn(\d+)\b/g, "in $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function chooseTheme(themes) {
  const preferred = preferredThemes.find((theme) => themes.includes(theme));
  if (preferred) return humanizeTheme(preferred);
  return humanizeTheme(themes.find((theme) => !ignoredThemes.has(theme)));
}

function normalizePuzzle(raw) {
  const moves = String(raw.m).trim().split(/\s+/);
  const theme = chooseTheme(Array.isArray(raw.t) ? raw.t : []);
  return {
    id: raw.i,
    title: theme,
    description: "Find the strongest continuation.",
    fen: raw.f,
    setupMove: moves[0],
    solution: moves.slice(1),
    rating: Number(raw.r),
    theme,
  };
}

function squareList() {
  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
}

function isLightSquare(square) {
  const fileNumber = square.charCodeAt(0) - 96;
  return (fileNumber + Number(square[1])) % 2 === 1;
}

function moveObjectFromUci(uci) {
  const move = { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  if (uci.length > 4) move.promotion = uci.slice(4, 5);
  return move;
}

function moveToUci(move) {
  return `${move.from}${move.to}${move.promotion || ""}`;
}

function buildAttemptedMove(from, to) {
  const piece = chess.get(from);
  const move = { from, to };
  if (piece?.type === "p" && (to.endsWith("8") || to.endsWith("1"))) {
    const expected = activeSolution[solutionIndex];
    move.promotion = expected?.startsWith(`${from}${to}`) && expected.length > 4 ? expected[4] : "q";
  }
  return move;
}

function addCoordinate(button, value, className) {
  const label = document.createElement("span");
  label.className = `coordinate ${className}`;
  label.textContent = value;
  label.setAttribute("aria-hidden", "true");
  button.append(label);
}

function updatePuzzleText() {
  const puzzle = currentPuzzle();
  const side = sideName(startingSide);
  titleEl.textContent = puzzle.title;
  descriptionEl.textContent = puzzle.id ? `${side} to move. ${puzzle.description}` : puzzle.description;
  ratingEl.textContent = `Rating ${Number(puzzle.rating).toLocaleString()}`;
  themeEl.textContent = puzzle.theme;
  sideEl.textContent = `${side} to move`;
  counterEl.textContent = `${(puzzleIndex + 1).toLocaleString()} / ${puzzles.length.toLocaleString()}`;
  counterEl.setAttribute("aria-label", `Puzzle ${puzzleIndex + 1} of ${puzzles.length}`);
  progressEl.style.width = `${((puzzleIndex + 1) / puzzles.length) * 100}%`;
}

function renderBoard() {
  boardEl.innerHTML = "";
  boardEl.setAttribute("aria-label", `Interactive chess board, ${orientation === "white" ? "White" : "Black"} side at the bottom`);

  const legalMovesByTarget = new Map(legalTargets.map((move) => [move.to, move]));
  const leftFile = orientation === "white" ? "a" : "h";
  const bottomRank = orientation === "white" ? "1" : "8";

  squareList().forEach((square) => {
    const button = document.createElement("button");
    const piece = chess.get(square);
    const legalMove = legalMovesByTarget.get(square);

    button.className = `square ${isLightSquare(square) ? "light" : "dark"}`;
    button.type = "button";
    button.dataset.square = square;
    button.setAttribute("role", "gridcell");
    button.setAttribute(
      "aria-label",
      piece ? `${square}, ${sideName(piece.color)} ${pieceNames[piece.type]}` : `${square}, empty`,
    );

    if (square === selectedSquare) {
      button.classList.add("selected");
      button.setAttribute("aria-selected", "true");
    }
    if (legalMove) button.classList.add(legalMove.captured ? "capture" : "legal");
    if (lastMove && (square === lastMove.from || square === lastMove.to)) button.classList.add("last-move");

    if (piece) {
      const pieceSpan = document.createElement("span");
      pieceSpan.className = `piece ${piece.color === "w" ? "piece-white" : "piece-black"}`;
      pieceSpan.textContent = pieces[`${piece.color}${piece.type}`];
      pieceSpan.setAttribute("aria-hidden", "true");
      button.append(pieceSpan);
    }

    if (square[1] === bottomRank) addCoordinate(button, square[0], "file-label");
    if (square[0] === leftFile) addCoordinate(button, square[1], "rank-label");

    button.addEventListener("click", () => handleSquareClick(square));
    boardEl.append(button);
  });
}

function getAudioContext() {
  if (!soundEnabled) return null;
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(context, frequency, start, duration, volume, type = "sine") {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * 0.72), start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playMoveSound(move, solved = false) {
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  playTone(context, 210, now, 0.045, 0.12, "triangle");

  if (move.captured) {
    playTone(context, 145, now + 0.055, 0.06, 0.11, "triangle");
  }
  if (move.san.includes("+") || move.san.includes("#")) {
    playTone(context, 660, now + 0.075, 0.13, 0.07, "sine");
  }
  if (solved) {
    playTone(context, 523, now + 0.12, 0.14, 0.055, "sine");
    playTone(context, 659, now + 0.2, 0.16, 0.05, "sine");
    playTone(context, 784, now + 0.28, 0.2, 0.045, "sine");
  }
}

function playErrorSound() {
  const context = getAudioContext();
  if (!context) return;
  playTone(context, 130, context.currentTime, 0.13, 0.065, "sawtooth");
}

function selectSquare(square) {
  const piece = chess.get(square);
  if (!piece) return false;

  if (piece.color !== chess.turn()) {
    statusEl.textContent = `It is ${sideName(chess.turn())} to move.`;
    return false;
  }

  selectedSquare = square;
  legalTargets = chess.moves({ square, verbose: true });
  statusEl.textContent = legalTargets.length ? "Now choose the target square." : "That piece has no legal move.";
  renderBoard();
  return true;
}

function handleSquareClick(square) {
  if (!selectedSquare) {
    selectSquare(square);
    return;
  }

  if (square === selectedSquare) {
    selectedSquare = null;
    legalTargets = [];
    statusEl.textContent = "Selection cleared.";
    renderBoard();
    return;
  }

  const attemptedMove = buildAttemptedMove(selectedSquare, square);
  let move;

  try {
    move = chess.move(attemptedMove);
  } catch (error) {
    move = null;
  }

  if (!move) {
    if (!selectSquare(square)) {
      statusEl.textContent = "Illegal move. Try another square.";
      selectedSquare = null;
      legalTargets = [];
      renderBoard();
    }
    return;
  }

  const expected = activeSolution[solutionIndex];
  const played = moveToUci(move);
  const alternateMate = activeSolution.length === 1 && chess.isCheckmate();

  if (played !== expected && !alternateMate) {
    chess.undo();
    playErrorSound();
    statusEl.textContent = "Legal, but not the puzzle solution. Try again.";
    selectedSquare = null;
    legalTargets = [];
    renderBoard();
    return;
  }

  lastMove = { from: move.from, to: move.to };
  solutionIndex += 1;
  selectedSquare = null;
  legalTargets = [];

  if (solutionIndex >= activeSolution.length || alternateMate) {
    playMoveSound(move, true);
    statusEl.textContent = chess.isCheckmate() ? `Correct: ${move.san} is checkmate.` : `Correct: ${move.san}. Puzzle solved.`;
    updatePuzzleText();
    renderBoard();
    return;
  }

  playMoveSound(move);
  statusEl.textContent = `Correct: ${move.san}. Watch the reply.`;
  updatePuzzleText();
  renderBoard();
  window.setTimeout(playForcedReply, 480);
}

function playForcedReply() {
  const reply = activeSolution[solutionIndex];
  if (!reply) return;

  let move;
  try {
    move = chess.move(moveObjectFromUci(reply));
  } catch (error) {
    move = null;
  }

  if (move) {
    lastMove = { from: move.from, to: move.to };
    solutionIndex += 1;
    playMoveSound(move);
    statusEl.textContent = `${sideName(move.color)} replied ${move.san}. Find the next move.`;
  }

  updatePuzzleText();
  renderBoard();
}

function loadPuzzle(index) {
  puzzleIndex = (index + puzzles.length) % puzzles.length;
  const puzzle = currentPuzzle();
  chess = new Chess(puzzle.fen);

  if (puzzle.setupMove) {
    chess.move(moveObjectFromUci(puzzle.setupMove));
  }

  activeSolution = [...puzzle.solution];
  startingSide = chess.turn();
  selectedSquare = null;
  legalTargets = [];
  solutionIndex = 0;
  orientation = startingSide === "b" ? "black" : "white";
  lastMove = null;
  statusEl.textContent = "Choose a piece, then choose the target square.";
  updatePuzzleText();
  renderBoard();
}

function setTrainerEnabled(enabled) {
  nextButton.disabled = !enabled;
  resetButton.disabled = !enabled;
  flipButton.disabled = !enabled;
}

async function initialize() {
  setTrainerEnabled(false);
  statusEl.textContent = "Loading the puzzle collection.";

  try {
    const response = await fetch("puzzles.json?v=2");
    if (!response.ok) throw new Error(`Puzzle pack request failed: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.puzzles) || data.puzzles.length < 1000) {
      throw new Error("Puzzle pack is incomplete");
    }
    puzzles = data.puzzles.map(normalizePuzzle);
  } catch (error) {
    console.error(error);
    puzzles = fallbackPuzzles;
  }

  setTrainerEnabled(true);
  loadPuzzle(0);
}

nextButton.addEventListener("click", () => loadPuzzle(puzzleIndex + 1));
resetButton.addEventListener("click", () => loadPuzzle(puzzleIndex));
flipButton.addEventListener("click", () => {
  orientation = orientation === "white" ? "black" : "white";
  renderBoard();
});
soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.setAttribute("aria-pressed", String(soundEnabled));
  soundButton.textContent = soundEnabled ? "Sound on" : "Sound off";
  if (soundEnabled) {
    const context = getAudioContext();
    if (context) playTone(context, 440, context.currentTime, 0.08, 0.05, "sine");
  }
});

initialize();
