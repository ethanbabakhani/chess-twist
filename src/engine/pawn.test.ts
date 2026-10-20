import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { proposeMoves } from './catalogue';
import { applyMove, isKingAttacked } from './rules';
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

const sortedRows = (moves: { to: [number, number] }[]) => moves.map(m => m.to[0]).sort((a, b) => a - b);

describe('pawn movement', () => {
  it('can move one or two squares from its start row', () => {
    const s = emptyState();
    put(s, 6, 4, 'pawn', 'white');
    expect(sortedRows(proposeMoves(s, 6, 4))).toEqual([4, 5]);
  });
  it('can only move one square after leaving the start row', () => {
    const s = emptyState();
    put(s, 5, 4, 'pawn', 'white');
    expect(proposeMoves(s, 5, 4)).toHaveLength(1);
  });
  it('is blocked by a piece directly ahead and cannot capture forward', () => {
    const s = emptyState();
    put(s, 6, 4, 'pawn', 'white');
    put(s, 5, 4, 'pawn', 'black');
    expect(proposeMoves(s, 6, 4)).toHaveLength(0);
  });
  it('cannot make the two-square move if the second square is occupied', () => {
    const s = emptyState();
    put(s, 6, 4, 'pawn', 'white');
    put(s, 4, 4, 'knight', 'black');
    expect(proposeMoves(s, 6, 4)).toHaveLength(1);
  });
  it('captures diagonally only onto an enemy piece', () => {
    const s = emptyState();
    put(s, 6, 4, 'pawn', 'white');
    put(s, 5, 3, 'pawn', 'black');
    put(s, 5, 5, 'pawn', 'white');
    const targets = proposeMoves(s, 6, 4).map(m => `${m.to[0]},${m.to[1]}`);
    expect(targets).toContain('5,3');
    expect(targets).not.toContain('5,5');
  });
  it('black pawns move down the board', () => {
    const s = emptyState('black');
    put(s, 1, 4, 'pawn', 'black');
    expect(sortedRows(proposeMoves(s, 1, 4))).toEqual([2, 3]);
  });
});

describe('pawns and check', () => {
  it('attacks diagonally', () => {
    const s = emptyState();
    put(s, 0, 4, 'king', 'black');
    put(s, 1, 3, 'pawn', 'white');
    expect(isKingAttacked(s, 'black')).toBe(true);
  });
  it('does not give check from directly in front of the king', () => {
    const s = emptyState();
    put(s, 0, 4, 'king', 'black');
    put(s, 1, 4, 'pawn', 'white');
    expect(isKingAttacked(s, 'black')).toBe(false);
  });
});

describe('promotion', () => {
  it('turns a pawn into a queen on the far row', () => {
    const s = emptyState();
    put(s, 1, 0, 'pawn', 'white');
    const after = applyMove(s, { from: [1, 0], to: [0, 0], mode: 'move' });
    expect(after.board[0][0]?.type).toBe('queen');
  });
});
