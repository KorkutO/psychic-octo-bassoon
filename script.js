import { Chess } from "https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js";

const puzzles = [
  {
    title: "Scholar's finish",
    description: "White to move. The king is still in the center.",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
    solution: ["h5f7"],
    rating: "Easy",
    theme: "Mate",
  },
  {
    title: "Quiet queen mate",
    description: "White to move. Use the open back rank.",
    fen: "7k/6pp/8/3Q4/8/8/6PP/6K1 w - - 0 1",
    solution: ["d5d8"],
    rating: "Easy",
    theme: "Back rank",
  },
  {
    title: "Rook lift",
    description: "White to move. One rook move ends the game.",
    fen: "6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1",
    solution: ["a1a8"],
    rating: "Easy",
    theme: "Rook mate",
  },
  {
    title: "Dark-square net",
    description: "Black to move. The queen enters on the first rank.",
    fen: "6k1/5ppp/8/2b5/8/8/4qPPP/6K1 b - - 0 1",
    solution: ["e2e1"],
    rating: "Medium",
    theme: "Queen mate",
  },
  {
    title: "Back-rank file",
    description: "Black to move. The rook uses the empty file.",
    fen: "r5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1",
    solution: ["a8a1"],
    rating: "Medium",
    theme: "Rook mate",
  },
];

const pieces = {
  wp: "♙",
  wn: "♘",
  wb: "♗",
  wr: "♖",
  wq: "♕",
  wk: "♔",
  bp: "♟",
  bn: "♞",
  bb: "♝",
  br: "♜",
  bq: "♛",
  bk: "♚",
};

const boardEl = document.querySelector("#board");
const titleEl = document.querySelector("#puzzle-title");
const descriptionEl = document.querySelector("#puzzle-description");
const ratingEl = document.querySelector("#puzzle-rating");
const themeEl = document.querySelector("#puzzle-theme");
const sideEl = document.querySelector("#puzzle-side-to-move");
const counterEl = document.querySelector("#puzzle-counter");
const statusEl = document.querySelector("#status");
const nextButton = document.querySelector("#next-puzzle");
const resetButton = document.querySelector("#reset-puzzle");
const flipButton = document.querySelector("#flip-board");

let puzzleIndex = 0;
let chess = new Chess(puzzles[puzzleIndex].fen);
let selectedSquare = null;
let legalTargets = [];
let solutionIndex = 0;
let orientation = chess.turn() === "b" ? "black" : "white";
let lastMove = null;

function currentPuzzle() {
  return puzzles[puzzleIndex];
}

function sideName(color) {
  return color === "w" ? "White" : "Black";
}

function squareList() {
  const files = orientation === "white" ? ["a", "b", "c", "d", "e", "f", "g", "h"] : ["h", "g", "f", "e", "d", "c", "b", "a"];
  const ranks = orientation === "white" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  return ranks.flatMap((rank) => files.map((file) => `${file}${rank}`));
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
    move.promotion = "q";
  }
  return move;
}

function updatePuzzleText() {
  const puzzle = currentPuzzle();
  titleEl.textContent = puzzle.title;
  descriptionEl.textContent = puzzle.description;
  ratingEl.textContent = puzzle.rating;
  themeEl.textContent = puzzle.theme;
  sideEl.textContent = `${sideName(chess.turn())} to move`;
  counterEl.textContent = `${puzzleIndex + 1} / ${puzzles.length}`;
}

function renderBoard() {
  boardEl.innerHTML = "";
  const legalSquares = new Set(legalTargets.map((move) => move.to));

  squareList().forEach((square, index) => {
    const button = document.createElement("button");
    const piece = chess.get(square);
    const isLight = (Math.floor(index / 8) + (index % 8)) % 2 === 0;

    button.className = `square ${isLight ? "light" : "dark"}`;
    button.type = "button";
    button.dataset.square = square;
    button.setAttribute("aria-label", square);

    if (square === selectedSquare) button.classList.add("selected");
    if (legalSquares.has(square)) button.classList.add("legal");
    if (lastMove && (square === lastMove.from || square === lastMove.to)) button.classList.add("last-move");

    if (piece) {
      const pieceSpan = document.createElement("span");
      pieceSpan.className = piece.color === "w" ? "piece-white" : "piece-black";
      pieceSpan.textContent = pieces[`${piece.color}${piece.type}`];
      button.append(pieceSpan);
    }

    if ((orientation === "white" && square.endsWith("1")) || (orientation === "black" && square.endsWith("8"))) {
      const label = document.createElement("span");
      label.className = "square-label";
      label.textContent = square[0];
      button.append(label);
    }

    button.addEventListener("click", () => handleSquareClick(square));
    boardEl.append(button);
  });
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

  const expected = currentPuzzle().solution[solutionIndex];
  const played = moveToUci(move);

  if (played !== expected) {
    chess.undo();
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

  if (solutionIndex >= currentPuzzle().solution.length) {
    statusEl.textContent = chess.isCheckmate() ? `Correct: ${move.san} is checkmate.` : `Correct: ${move.san}. Puzzle solved.`;
    updatePuzzleText();
    renderBoard();
    return;
  }

  statusEl.textContent = `Correct: ${move.san}. Watch the reply.`;
  updatePuzzleText();
  renderBoard();
  window.setTimeout(playForcedReply, 550);
}

function playForcedReply() {
  const reply = currentPuzzle().solution[solutionIndex];
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
    statusEl.textContent = `${sideName(move.color)} replied ${move.san}. Find the next move.`;
  }

  updatePuzzleText();
  renderBoard();
}

function loadPuzzle(index) {
  puzzleIndex = (index + puzzles.length) % puzzles.length;
  chess = new Chess(currentPuzzle().fen);
  selectedSquare = null;
  legalTargets = [];
  solutionIndex = 0;
  orientation = chess.turn() === "b" ? "black" : "white";
  lastMove = null;
  statusEl.textContent = "Choose a piece, then choose the target square.";
  updatePuzzleText();
  renderBoard();
}

nextButton.addEventListener("click", () => loadPuzzle(puzzleIndex + 1));
resetButton.addEventListener("click", () => loadPuzzle(puzzleIndex));
flipButton.addEventListener("click", () => {
  orientation = orientation === "white" ? "black" : "white";
  renderBoard();
});

loadPuzzle(0);
