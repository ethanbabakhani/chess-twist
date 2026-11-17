import { CATALOGUE } from '../engine/catalogue';
import type { Side } from '../engine/types';

const GLYPHS: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖', 'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜', 'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

export const DESCRIPTIONS: Record<string, string> = {
  king: 'Steps one square in any direction. Checkmate it and you lose.',
  queen: 'Slides any distance in any direction.',
  rook: 'Slides any distance along ranks and files.',
  bishop: 'Slides any distance diagonally.',
  knight: 'Jumps in an L shape.',
  pawn: 'Moves forward, captures diagonally, promotes on the far rank.',
  soldier: 'Steps one square in any direction, like a king. Promotes like a pawn.',
  bully: 'Starts on the d or e file. Moves and captures straight ahead only: up to 3 squares on its first move.',
  jester: 'Steps one square orthogonally, or jumps exactly two squares diagonally.',
  wizard: 'Slides diagonally and bounces off the board edges.',
  archer: 'Moves like a rook. On either back rank it also slides diagonally.',
  warden: 'Replaces the king. Steps one square, or up to two while your side trails by 3 or more points.',
};

// Unicode chess symbol when one exists, otherwise the piece's short text label
export function labelFor(type: string, side: Side): { text: string; custom: boolean } {
  const symbol = GLYPHS[`${side}-${type}`];
  if (symbol) return { text: symbol, custom: false };
  return { text: CATALOGUE[type]?.icon ?? '?', custom: true };
}

export function displayName(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}
