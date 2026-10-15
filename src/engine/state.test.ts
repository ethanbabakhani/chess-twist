import { describe, it, expect } from 'vitest';
import { createInitialState, cloneState } from './state';

describe('cloneState', () => {
  it('produces an independent copy', () => {
    const a = createInitialState();
    const b = cloneState(a);
    b.board[6][0] = null;
    expect(a.board[6][0]).not.toBeNull();
  });
});