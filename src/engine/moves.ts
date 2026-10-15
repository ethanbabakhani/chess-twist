import type { GameState, Move, Offset } from './types';

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function jump(state: GameState, r: number, c: number, offsets: Offset[]): Move[] {
  const me = state.board[r][c];
  if (!me) return [];
  const moves: Move[] = [];
  for (const [dr, dc] of offsets) {
    const tr = r + dr;
    const tc = c + dc;
    if (!inBounds(tr, tc)) continue;
    const target = state.board[tr][tc];
    if (target && target.side === me.side) continue;   // can't land on your own piece
    moves.push({ from: [r, c], to: [tr, tc], mode: 'both' });
  }
  return moves;
}

export function slide(state: GameState, r: number, c: number, directions: Offset[], maxSteps: number): Move[] {
  const me = state.board[r][c];
  if (!me) return [];
  const moves: Move[] = [];
  for (const [dr, dc] of directions) {
    for (let step = 1; step <= maxSteps; step++) {
      const tr = r + dr * step;
      const tc = c + dc * step;
      if (!inBounds(tr, tc)) break;
      const target = state.board[tr][tc];
      if (target && target.side === me.side) break;    // blocked by your own piece
      moves.push({ from: [r, c], to: [tr, tc], mode: 'both' });
      if (target) break;                               // captured an enemy, so stop here
    }
  }
  return moves;
}
