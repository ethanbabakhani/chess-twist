import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { proposeMoves } from './catalogue';
import type { GameState } from './types';

function emptyState(): GameState {
  const s = createInitialState();
  s.board = Array.from({ length: 8 }, () => Array(8).fill(null));
  return s;
}

describe('knight', () => {
  it('has 2 moves in a corner', () => {
    const s = emptyState();
    s.board[7][0] = { type: 'knight', side: 'white', hasMoved: false };
    expect(proposeMoves(s, 7, 0)).toHaveLength(2);
  });
  it('cannot land on its own piece', () => {
    const s = emptyState();
    s.board[7][0] = { type: 'knight', side: 'white', hasMoved: false };
    s.board[5][1] = { type: 'pawn', side: 'white', hasMoved: false };
    expect(proposeMoves(s, 7, 0)).toHaveLength(1);
  });
});

describe('rook', () => {
  it('stops at an enemy piece and can capture it', () => {
    const s = emptyState();
    s.board[7][0] = { type: 'rook', side: 'white', hasMoved: false };
    s.board[4][0] = { type: 'pawn', side: 'black', hasMoved: false };
    const targets = proposeMoves(s, 7, 0).map(m => `${m.to[0]},${m.to[1]}`);
    expect(targets).toContain('4,0');
    expect(targets).not.toContain('3,0');
  });
});

describe('bishop, queen, king on an empty board', () => {
  function countMoves(type: string): number {
    const s = emptyState();
    s.board[4][3] = { type, side: 'white', hasMoved: false };
    return proposeMoves(s, 4, 3).length;
  }
  it('bishop in the middle has 13 moves', () => expect(countMoves('bishop')).toBe(13));
  it('queen in the middle has 27 moves', () => expect(countMoves('queen')).toBe(27));
  it('king in the middle has 8 moves', () => expect(countMoves('king')).toBe(8));
});