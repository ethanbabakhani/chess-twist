import type { GameState, Move } from './types';
import { cloneState } from './state';

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = next.board[fr][fc];
  if (!piece) return next;
  piece.hasMoved = true;
  next.board[tr][tc] = piece;   // lands on the target, replacing any captured piece
  next.board[fr][fc] = null;
  next.turn = next.turn === 'white' ? 'black' : 'white';
  next.turnCount += 1;
  return next;
}
