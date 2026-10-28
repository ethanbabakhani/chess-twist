import type { GameState, Move, Offset } from './types';

const DIAGONALS: Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

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

// Diagonal slides that bounce off the board edges. Each of the four rays stops at the first piece
// it meets, or when it repeats a square-and-direction it has already visited (so no cap is needed).
export function bounceSlide(state: GameState, r: number, c: number): Move[] {
  const me = state.board[r][c];
  if (!me) return [];
  const found = new Map<string, Move>();   // a square reachable by several paths is kept once
  for (const [startDr, startDc] of DIAGONALS) {
    let cr = r;
    let cc = c;
    let dr = startDr;
    let dc = startDc;
    const seen = new Set<string>();
    while (true) {
      let nr = cr + dr;
      let nc = cc + dc;
      if (nr < 0 || nr > 7) { dr = -dr; nr = cr + dr; }   // bounce off the top or bottom edge
      if (nc < 0 || nc > 7) { dc = -dc; nc = cc + dc; }   // bounce off a side edge
      const key = `${nr},${nc},${dr},${dc}`;
      if (seen.has(key)) break;
      seen.add(key);
      if (nr === r && nc === c) break;                    // never passes back through its start square
      const target = state.board[nr][nc];
      if (target && target.side === me.side) break;       // blocked by your own piece
      const square = `${nr},${nc}`;
      if (!found.has(square)) found.set(square, { from: [r, c], to: [nr, nc], mode: 'both' });
      if (target) break;                                  // captured an enemy, so stop here
      cr = nr;
      cc = nc;
    }
  }
  return [...found.values()];
}
