import type { GameState, Move, Offset, Piece } from './types';
import { jump, slide } from './moves';
import { pawnMoves } from './pawn';

export type Family = 'king' | 'queen' | 'pawn' | 'skill';

export type PieceDef = {
  family: Family;
  tags?: string[];   // subsets within a family, e.g. 'rook-like'
  baseMoves: (state: GameState, r: number, c: number) => Move[];
  condition?: (state: GameState, r: number, c: number) => boolean;
  altMoves?: (state: GameState, r: number, c: number) => Move[];
};

const KNIGHT_OFFSETS: Offset[] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const ROOK_DIRS: Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL_DIRS: Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL_DIRS: Offset[] = [...ROOK_DIRS, ...DIAGONAL_DIRS];

export const CATALOGUE: Record<string, PieceDef> = {
  knight: { family: 'skill', tags: ['knight-like'], baseMoves: (s, r, c) => jump(s, r, c, KNIGHT_OFFSETS) },
  rook: { family: 'skill', tags: ['rook-like'], baseMoves: (s, r, c) => slide(s, r, c, ROOK_DIRS, 8) },
  bishop: { family: 'skill', tags: ['bishop-like'], baseMoves: (s, r, c) => slide(s, r, c, DIAGONAL_DIRS, 8) },
  queen: { family: 'queen', baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 8) },
  king: { family: 'king', baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 1) },
  pawn: { family: 'pawn', baseMoves: pawnMoves },
};

export function familyOf(piece: Piece): Family | null {
  return CATALOGUE[piece.type]?.family ?? null;
}

export function hasTag(piece: Piece, tag: string): boolean {
  return CATALOGUE[piece.type]?.tags?.includes(tag) ?? false;
}

export function proposeMoves(state: GameState, r: number, c: number): Move[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const def = CATALOGUE[piece.type];
  if (!def) return [];
  const useAlt = def.condition?.(state, r, c) ?? false;
  return useAlt && def.altMoves ? def.altMoves(state, r, c) : def.baseMoves(state, r, c);
}
