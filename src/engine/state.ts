import type { GameState, Piece, Side } from './types';

export function cloneState(state: GameState): GameState {
  return structuredClone(state);
}

const BACK_RANK = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];

function makePiece(type: string, side: Side): Piece {
  return { type, side, hasMoved: false };
}

export function createInitialState(): GameState {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let c = 0; c < 8; c++) {
    board[0][c] = makePiece(BACK_RANK[c], 'black');
    board[1][c] = makePiece('pawn', 'black');
    board[6][c] = makePiece('pawn', 'white');
    board[7][c] = makePiece(BACK_RANK[c], 'white');
  }
  return { board, turn: 'white', turnCount: 0, effects: [] };
}