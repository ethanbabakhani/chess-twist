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

// Testing setup (open the site with ?sandbox): drops the custom pieces into the standard layout
export function createSandboxState(): GameState {
  const state = createInitialState();
  for (const side of ['white', 'black'] as const) {
    const back = side === 'white' ? 7 : 0;
    const pawnRow = side === 'white' ? 6 : 1;
    state.board[back][0] = makePiece('archer', side);
    state.board[back][2] = makePiece('wizard', side);
    state.board[back][4] = makePiece('warden', side);
    state.board[back][5] = makePiece('jester', side);
    state.board[pawnRow][0] = makePiece('soldier', side);
    state.board[pawnRow][3] = makePiece('bully', side);
    state.board[pawnRow][4] = makePiece('bully', side);
    state.board[pawnRow][7] = makePiece('soldier', side);
  }
  return state;
}
