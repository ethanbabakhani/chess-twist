import type { GameState, Move, Offset, Piece, Side } from './types';
import { jump, slide, bounceSlide } from './moves';
import { pawnMoves, bullyMoves } from './pawn';

export type Family = 'king' | 'queen' | 'pawn' | 'skill';

export type PieceDef = {
  family: Family;
  tags?: string[];   // subsets within a family, e.g. 'rook-like'
  value?: number;    // material value (also the draft cost for now)
  icon?: string;     // short label for pieces that have no Unicode chess symbol
  baseMoves: (state: GameState, r: number, c: number) => Move[];
  condition?: (state: GameState, r: number, c: number) => boolean;
  altMoves?: (state: GameState, r: number, c: number) => Move[];
};

const KNIGHT_OFFSETS: Offset[] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const ROOK_DIRS: Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL_DIRS: Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL_DIRS: Offset[] = [...ROOK_DIRS, ...DIAGONAL_DIRS];
const JESTER_OFFSETS: Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 2], [2, -2], [-2, 2], [-2, -2]];

const WARDEN_DEFICIT = 3;   // points behind in material that wake the Warden's extra range

export const CATALOGUE: Record<string, PieceDef> = {
  // Standard pieces
  knight: { family: 'skill', tags: ['knight-like'], value: 3, baseMoves: (s, r, c) => jump(s, r, c, KNIGHT_OFFSETS) },
  rook: { family: 'skill', tags: ['rook-like'], value: 5, baseMoves: (s, r, c) => slide(s, r, c, ROOK_DIRS, 8) },
  bishop: { family: 'skill', tags: ['bishop-like'], value: 3, baseMoves: (s, r, c) => slide(s, r, c, DIAGONAL_DIRS, 8) },
  queen: { family: 'queen', value: 9, baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 8) },
  king: { family: 'king', value: 0, baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 1) },
  pawn: { family: 'pawn', value: 1, baseMoves: pawnMoves },

  // Custom pieces
  soldier: { family: 'pawn', value: 2, icon: 'So', baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 1) },
  bully: { family: 'pawn', value: 1, icon: 'Bu', baseMoves: bullyMoves },
  jester: {
    family: 'skill', tags: ['bishop-like'], value: 2, icon: 'Je',
    baseMoves: (s, r, c) => jump(s, r, c, JESTER_OFFSETS),
  },
  wizard: {
    family: 'skill', tags: ['bishop-like'], value: 5, icon: 'Wz',
    baseMoves: (s, r, c) => bounceSlide(s, r, c),
  },
  archer: {
    family: 'skill', tags: ['rook-like'], value: 6, icon: 'Ar',
    baseMoves: (s, r, c) => slide(s, r, c, ROOK_DIRS, 8),
    condition: (_s, r) => r === 0 || r === 7,   // standing on either back rank
    altMoves: (s, r, c) => [...slide(s, r, c, ROOK_DIRS, 8), ...slide(s, r, c, DIAGONAL_DIRS, 8)],
  },
  warden: {
    family: 'king', value: 0, icon: 'Wd',
    baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 1),
    condition: (s, r, c) => {
      const p = s.board[r][c];
      return !!p && materialDeficit(s, p.side) >= WARDEN_DEFICIT;
    },
    altMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 2),
  },
};

export function familyOf(piece: Piece): Family | null {
  return CATALOGUE[piece.type]?.family ?? null;
}

export function hasTag(piece: Piece, tag: string): boolean {
  return CATALOGUE[piece.type]?.tags?.includes(tag) ?? false;
}

// Total value of a side's pieces
export function materialOf(state: GameState, side: Side): number {
  let total = 0;
  for (const row of state.board) {
    for (const p of row) {
      if (p && p.side === side) total += CATALOGUE[p.type]?.value ?? 0;
    }
  }
  return total;
}

// How many points `side` trails by (negative if it is ahead)
export function materialDeficit(state: GameState, side: Side): number {
  const other: Side = side === 'white' ? 'black' : 'white';
  return materialOf(state, other) - materialOf(state, side);
}

export function proposeMoves(state: GameState, r: number, c: number): Move[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const def = CATALOGUE[piece.type];
  if (!def) return [];
  const useAlt = def.condition?.(state, r, c) ?? false;
  return useAlt && def.altMoves ? def.altMoves(state, r, c) : def.baseMoves(state, r, c);
}
