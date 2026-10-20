import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyMove, isKingAttacked, getLegalMoves, getStatus } from './rules';
import type { GameState, Side } from './types';

function emptyState(turn: Side = 'white'): GameState {
  const s = createInitialState();
  s.board = Array.from({ length: 8 }, () => Array(8).fill(null));
  s.turn = turn;
  return s;
}

function put(s: GameState, r: number, c: number, type: string, side: Side): void {
  s.board[r][c] = { type, side, hasMoved: false };
}

describe('applyMove', () => {
  it('moves the piece and switches the turn without touching the original', () => {
    const before = createInitialState();
    const after = applyMove(before, { from: [7, 1], to: [5, 2], mode: 'both' });
    expect(after.board[5][2]?.type).toBe('knight');
    expect(after.board[7][1]).toBeNull();
    expect(after.turn).toBe('black');
    expect(before.board[7][1]?.type).toBe('knight');
    expect(before.turn).toBe('white');
  });
});

describe('isKingAttacked', () => {
  it('sees a rook attacking down an open file', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 0, 4, 'rook', 'black');
    expect(isKingAttacked(s, 'white')).toBe(true);
  });
  it('is blocked by a piece in between', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 0, 4, 'rook', 'black');
    put(s, 3, 4, 'knight', 'white');
    expect(isKingAttacked(s, 'white')).toBe(false);
  });
});

describe('getLegalMoves', () => {
  it('a pinned rook can only move along the pin line', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 6, 4, 'rook', 'white');
    put(s, 0, 4, 'rook', 'black');
    const moves = getLegalMoves(s, 6, 4);
    expect(moves).toHaveLength(6);
    expect(moves.every(m => m.to[1] === 4)).toBe(true);
  });
  it('a king cannot step onto an attacked square', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 0, 3, 'rook', 'black');
    expect(getLegalMoves(s, 7, 4)).toHaveLength(3);
  });
});

describe('getStatus', () => {
  it('starts as playing', () => {
    expect(getStatus(createInitialState())).toBe('playing');
  });
  it('detects a back-rank checkmate', () => {
    const s = emptyState('black');
    put(s, 0, 7, 'king', 'black');
    put(s, 1, 6, 'pawn', 'black');
    put(s, 1, 7, 'pawn', 'black');
    put(s, 0, 0, 'rook', 'white');
    put(s, 7, 0, 'king', 'white');
    expect(getStatus(s)).toBe('checkmate');
  });
  it('detects a stalemate', () => {
    const s = emptyState('black');
    put(s, 0, 0, 'king', 'black');
    put(s, 2, 1, 'queen', 'white');
    put(s, 7, 7, 'king', 'white');
    expect(getStatus(s)).toBe('stalemate');
  });
});
