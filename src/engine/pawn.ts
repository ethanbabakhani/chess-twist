import type { GameState, Move, Offset } from './types';
import { inBounds, slide } from './moves';

export function pawnMoves(state: GameState, r: number, c: number): Move[] {
  const pawn = state.board[r][c];
  if (!pawn) return [];
  const dir = pawn.side === 'white' ? -1 : 1;            // white moves up the screen (row numbers shrink)
  const startRow = pawn.side === 'white' ? 6 : 1;
  const moves: Move[] = [];

  // Forward one, only onto an empty square
  const oneR = r + dir;
  if (inBounds(oneR, c) && !state.board[oneR][c]) {
    moves.push({ from: [r, c], to: [oneR, c], mode: 'move' });
    // Forward two from the start row, only if both squares are empty
    const twoR = r + 2 * dir;
    if (r === startRow && !state.board[twoR][c]) {
      moves.push({ from: [r, c], to: [twoR, c], mode: 'move' });
    }
  }

  // Diagonal captures, only onto an enemy piece
  for (const dc of [-1, 1]) {
    const tr = r + dir;
    const tc = c + dc;
    if (!inBounds(tr, tc)) continue;
    const target = state.board[tr][tc];
    if (target && target.side !== pawn.side) {
      moves.push({ from: [r, c], to: [tr, tc], mode: 'capture' });
    }
  }
  return moves;
}

// Bully: moves and captures straight ahead only. Up to 3 squares on its first move, then 1.
export function bullyMoves(state: GameState, r: number, c: number): Move[] {
  const bully = state.board[r][c];
  if (!bully) return [];
  const forward: Offset = bully.side === 'white' ? [-1, 0] : [1, 0];
  return slide(state, r, c, [forward], bully.hasMoved ? 1 : 3);
}
