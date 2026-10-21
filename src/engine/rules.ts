import type { GameState, Move, Side, Square } from './types';
import { cloneState } from './state';
import { proposeMoves, familyOf, hasTag } from './catalogue';

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
  // Castling: the partner piece relocates too
  if (move.castle) {
    const [rfr, rfc] = move.castle.rookFrom;
    const [rtr, rtc] = move.castle.rookTo;
    const partner = next.board[rfr][rfc];
    if (partner) {
      partner.hasMoved = true;
      next.board[rtr][rtc] = partner;
      next.board[rfr][rfc] = null;
    }
  }
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

// Castling is generated here and NOT in proposeMoves, so attack detection never asks for it.
function castlingMoves(state: GameState, r: number, c: number): Move[] {
  const king = state.board[r][c];
  if (!king || familyOf(king) !== 'king' || king.hasMoved) return [];
  const homeRow = king.side === 'white' ? 7 : 0;
  if (r !== homeRow || c !== 4) return [];
  if (isKingAttacked(state, king.side)) return [];

  const options = [
    { rookCol: 7, kingTo: 6, rookTo: 5 },   // kingside
    { rookCol: 0, kingTo: 2, rookTo: 3 },   // queenside
  ];
  const moves: Move[] = [];
  for (const { rookCol, kingTo, rookTo } of options) {
    const partner = state.board[r][rookCol];
    if (!partner || partner.side !== king.side || partner.hasMoved || !hasTag(partner, 'rook-like')) continue;

    // every square between the king and the partner must be empty
    let clear = true;
    for (let col = Math.min(c, rookCol) + 1; col <= Math.max(c, rookCol) - 1; col++) {
      if (state.board[r][col]) clear = false;
    }
    if (!clear) continue;

    // the king may not pass through an attacked square (getLegalMoves checks the landing square)
    const step = kingTo > c ? 1 : -1;
    const passThrough = applyMove(state, { from: [r, c], to: [r, c + step], mode: 'move' });
    if (isKingAttacked(passThrough, king.side)) continue;

    moves.push({
      from: [r, c],
      to: [r, kingTo],
      mode: 'move',
      castle: { rookFrom: [r, rookCol], rookTo: [r, rookTo] },
    });
  }
  return moves;
}

// Propose, then confirm: keep only moves that don't leave your own king attacked
export function getLegalMoves(state: GameState, r: number, c: number): Move[] {
  const piece = state.board[r][c];
  if (!piece) return [];
  const candidates = [...proposeMoves(state, r, c), ...castlingMoves(state, r, c)];
  return candidates.filter(move => {
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
