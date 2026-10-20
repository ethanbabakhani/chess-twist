import type { GameState, Move, Offset } from './types';
import { jump, slide } from './moves';
import { pawnMoves } from './pawn';
export type PieceDef = {
  baseMoves: (state: GameState, r: number, c: number) => Move[];
  condition?: (state: GameState, r: number, c: number) => boolean;
  altMoves?: (state: GameState, r: number, c: number) => Move[];
};

const KNIGHT_OFFSETS: Offset[] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const ROOK_DIRS: Offset[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAGONAL_DIRS: Offset[] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL_DIRS: Offset[] = [...ROOK_DIRS, ...DIAGONAL_DIRS];

export const CATALOGUE: Record<string, PieceDef> = {
  knight: { baseMoves: (s, r, c) => jump(s, r, c, KNIGHT_OFFSETS) },
  rook: { baseMoves: (s, r, c) => slide(s, r, c, ROOK_DIRS, 8) },
  bishop: { baseMoves: (s, r, c) => slide(s, r, c, DIAGONAL_DIRS, 8) },
  queen: { baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 8) },
  king: { baseMoves: (s, r, c) => slide(s, r, c, ALL_DIRS, 1) },
  pawn: { baseMoves: pawnMoves },
};

export function proposeMoves(state: GameState, r: number, c: number): Move[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const def = CATALOGUE[piece.type];
  if (!def) return [];
  const useAlt = def.condition?.(state, r, c) ?? false;
  return useAlt && def.altMoves ? def.altMoves(state, r, c) : def.baseMoves(state, r, c);
}
