import type { GameState, Move, Side, Square } from './types';
import { cloneState } from './state';
import { proposeMoves, familyOf } from './catalogue';

export type Status = 'playing' | 'check' | 'checkmate' | 'stalemate';

export function applyMove(state: GameState, move: Move): GameState {
  const next = cloneState(state);
  const [fr, fc] = move.from;
  const [tr, tc] = move.to;
  const piece = next.board[fr][fc];
  if (!piece) return next;
  piece.hasMoved = true;
  next.board[tr][tc] = piece;   // lands on the target, replacing any captured piece
  next.board[fr][fc] = null;
  // Promotion: a pawn-like piece reaching the far row becomes a queen
  if (familyOf(piece) === 'pawn' && ((piece.side === 'white' && tr === 0) || (piece.side === 'black' && tr === 7))) {
    piece.type = 'queen';
  }
  next.turn = next.turn === 'white' ? 'black' : 'white';
  next.turnCount += 1;
  return next;
}

export function findKing(state: GameState, side: Side): Square | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.side === side && familyOf(p) === 'king') return [r, c];
    }
  }
  return null;
}

// True if any enemy piece could capture `side`'s king right now
export function isKingAttacked(state: GameState, side: Side): boolean {
  const king = findKing(state, side);
  if (!king) return false;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (!p || p.side === side) continue;
      const attacks = proposeMoves(state, r, c).some(
        m => m.to[0] === king[0] && m.to[1] === king[1] && m.mode !== 'move'
      );
      if (attacks) return true;
    }
  }
  return false;
}

// Propose, then confirm: keep only moves that don't leave your own king attacked
export function getLegalMoves(state: GameState, r: number, c: number): Move[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  return proposeMoves(state, r, c).filter(move => {
    const next = applyMove(state, move);
    return !isKingAttacked(next, piece.side);
  });
}

export function getAllLegalMoves(state: GameState, side: Side): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = state.board[r][c];
      if (p && p.side === side) moves.push(...getLegalMoves(state, r, c));
    }
  }
  return moves;
}

export function getStatus(state: GameState): Status {
  const side = state.turn;
  const hasMoves = getAllLegalMoves(state, side).length > 0;
  const inCheck = isKingAttacked(state, side);
  if (!hasMoves) return inCheck ? 'checkmate' : 'stalemate';
  return inCheck ? 'check' : 'playing';
}
