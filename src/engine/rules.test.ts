import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { applyMove } from './rules';

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
