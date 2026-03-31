#!/usr/bin/env node
"use strict";

const readline = require("readline");

const USAGE = `
Tic Tac Toe (CLI)

Usage:
  node index.js                 # interactive play
  node index.js --simulate=1,5,2,8,3
  node index.js --test

Notes:
  - Moves are 1-9 (left-to-right, top-to-bottom).
  - --simulate runs a scripted game (useful for CI).
`;

function createBoard() {
  return Array(9).fill(" ");
}

function renderBoard(board) {
  const rows = [];
  for (let r = 0; r < 3; r++) {
    const row = board.slice(r * 3, r * 3 + 3).join(" | ");
    rows.push(` ${row} `);
  }
  return rows.join("\n-----------\n");
}

function isValidMove(board, move) {
  return Number.isInteger(move) && move >= 1 && move <= 9 && board[move - 1] === " ";
}

function applyMove(board, move, player) {
  if (!isValidMove(board, move)) {
    return { ok: false, reason: "Invalid move" };
  }
  board[move - 1] = player;
  return { ok: true };
}

function checkWinner(board) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of lines) {
    if (board[a] !== " " && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function isDraw(board) {
  return board.every((cell) => cell !== " ") && !checkWinner(board);
}

function nextPlayer(player) {
  return player === "X" ? "O" : "X";
}

function parseSimulatedMoves(arg) {
  if (!arg) return [];
  return arg
    .split(",")
    .map((token) => Number(token.trim()))
    .filter((n) => !Number.isNaN(n));
}

function runSimulation(moves) {
  const board = createBoard();
  let player = "X";

  for (const move of moves) {
    const result = applyMove(board, move, player);
    if (!result.ok) {
      return { status: "error", message: result.reason, board, winner: null };
    }

    const winner = checkWinner(board);
    if (winner) {
      return { status: "win", message: `${winner} wins`, board, winner };
    }
    if (isDraw(board)) {
      return { status: "draw", message: "Draw", board, winner: null };
    }

    player = nextPlayer(player);
  }

  return { status: "incomplete", message: "Game incomplete", board, winner: null };
}

function runTests() {
  const tests = [];

  // Winner detection
  const board1 = createBoard();
  applyMove(board1, 1, "X");
  applyMove(board1, 2, "X");
  applyMove(board1, 3, "X");
  tests.push({
    name: "detects horizontal win",
    passed: checkWinner(board1) === "X",
  });

  // Draw detection
  const board2 = [
    "X", "O", "X",
    "X", "O", "O",
    "O", "X", "X",
  ];
  tests.push({
    name: "detects draw",
    passed: isDraw(board2) === true,
  });

  // Invalid move
  const board3 = createBoard();
  applyMove(board3, 5, "X");
  tests.push({
    name: "rejects occupied move",
    passed: applyMove(board3, 5, "O").ok === false,
  });

  // Simulation
  const sim = runSimulation([1, 4, 2, 5, 3]);
  tests.push({
    name: "simulation finds winner",
    passed: sim.status === "win" && sim.winner === "X",
  });

  const failed = tests.filter((t) => !t.passed);
  return { passed: failed.length === 0, tests, failed };
}

function parseArgs(argv) {
  const options = {
    simulate: null,
    test: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") options.help = true;
    if (arg === "--test") options.test = true;
    if (arg.startsWith("--simulate=")) {
      options.simulate = arg.split("=")[1] || "";
    }
  }

  return options;
}

async function runInteractive() {
  const board = createBoard();
  let player = "X";
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

  console.log("\nWelcome to Tic Tac Toe!");
  console.log("Enter moves 1-9 (left-to-right, top-to-bottom).\n");

  while (true) {
    console.log(renderBoard(board));
    const answer = await ask(`\nPlayer ${player}, your move: `);
    const move = Number(answer.trim());

    if (!isValidMove(board, move)) {
      console.log("Invalid move. Try again.\n");
      continue;
    }

    applyMove(board, move, player);
    const winner = checkWinner(board);
    if (winner) {
      console.log("\n" + renderBoard(board));
      console.log(`\n${winner} wins!`);
      break;
    }
    if (isDraw(board)) {
      console.log("\n" + renderBoard(board));
      console.log("\nDraw!");
      break;
    }

    player = nextPlayer(player);
  }

  rl.close();
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(USAGE.trim());
    return 0;
  }

  if (options.test) {
    const result = runTests();
    for (const test of result.tests) {
      console.log(`${test.passed ? "PASS" : "FAIL"} - ${test.name}`);
    }
    return result.passed ? 0 : 1;
  }

  if (options.simulate !== null) {
    const moves = parseSimulatedMoves(options.simulate);
    const result = runSimulation(moves);
    console.log(renderBoard(result.board));
    console.log(`\n${result.message}`);
    return result.status === "error" ? 1 : 0;
  }

  await runInteractive();
  return 0;
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
