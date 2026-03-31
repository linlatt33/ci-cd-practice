"use strict";

const cells = Array.from(document.querySelectorAll(".cell"));
const statusText = document.querySelector("#status-text");
const statusBadge = document.querySelector("#status-badge");
const resetBoardBtn = document.querySelector("#reset-board");
const resetScoreBtn = document.querySelector("#reset-score");
const scoreX = document.querySelector("#score-x");
const scoreO = document.querySelector("#score-o");
const scoreDraw = document.querySelector("#score-draw");

const state = {
  board: Array(9).fill(""),
  player: "X",
  active: true,
  score: { X: 0, O: 0, D: 0 },
};

const winningLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function renderStatus(message, badgeText, badgeTone) {
  statusText.textContent = message;
  statusBadge.textContent = badgeText;
  statusBadge.style.color = badgeTone;
}

function clearBoard() {
  state.board = Array(9).fill("");
  state.player = "X";
  state.active = true;
  cells.forEach((cell) => {
    cell.textContent = "";
    cell.classList.remove("is-x", "is-o", "winner");
  });
  renderStatus("Player X starts", "In progress", "#6ee7ff");
}

function updateScores() {
  scoreX.textContent = String(state.score.X);
  scoreO.textContent = String(state.score.O);
  scoreDraw.textContent = String(state.score.D);
}

function findWinner() {
  for (const [a, b, c] of winningLines) {
    const value = state.board[a];
    if (value && value === state.board[b] && value === state.board[c]) {
      return { winner: value, line: [a, b, c] };
    }
  }
  return null;
}

function handleMove(index) {
  if (!state.active || state.board[index]) return;

  state.board[index] = state.player;
  const cell = cells[index];
  cell.textContent = state.player;
  cell.classList.add(state.player === "X" ? "is-x" : "is-o");

  const outcome = findWinner();
  if (outcome) {
    state.active = false;
    outcome.line.forEach((idx) => cells[idx].classList.add("winner"));
    state.score[outcome.winner] += 1;
    updateScores();
    renderStatus(`Player ${outcome.winner} wins`, "Finished", "#63e6be");
    return;
  }

  if (state.board.every((cellValue) => cellValue)) {
    state.active = false;
    state.score.D += 1;
    updateScores();
    renderStatus("Draw game", "Finished", "#ffb347");
    return;
  }

  state.player = state.player === "X" ? "O" : "X";
  renderStatus(`Player ${state.player}'s turn`, "In progress", "#6ee7ff");
}

cells.forEach((cell, index) => {
  cell.addEventListener("click", () => handleMove(index));
});

resetBoardBtn.addEventListener("click", clearBoard);
resetScoreBtn.addEventListener("click", () => {
  state.score = { X: 0, O: 0, D: 0 };
  updateScores();
  clearBoard();
});

clearBoard();
updateScores();
