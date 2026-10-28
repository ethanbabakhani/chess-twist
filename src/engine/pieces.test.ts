import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { proposeMoves, hasTag, materialOf, materialDeficit } from './catalogue';
import { applyMove, findKing, getLegalMoves } from './rules';
import type { GameState, Move, Side } from './types';

function emptyState(turn: Side = 'white'): GameState {
  const s = createInitialState();
  s.board = Array.from({ length: 8 }, () => Array(8).fill(null));
  s.turn = turn;
  return s;
}

function put(s: GameState, r: number, c: number, type: string, side: Side, hasMoved = false): void {
  s.board[r][c] = { type, side, hasMoved };
}

const targets = (moves: Move[]) => moves.map(m => `${m.to[0]},${m.to[1]}`).sort();

describe('material', () => {
  it('counts 39 points for a standard starting army', () => {
    const s = createInitialState();
    expect(materialOf(s, 'white')).toBe(39);
    expect(materialOf(s, 'black')).toBe(39);
    expect(materialDeficit(s, 'white')).toBe(0);
  });
  it('reports how far a side trails', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 0, 7, 'rook', 'black');
    expect(materialDeficit(s, 'white')).toBe(5);
    expect(materialDeficit(s, 'black')).toBe(-5);
  });
});

describe('soldier', () => {
  it('moves one square in any direction', () => {
    const s = emptyState();
    put(s, 4, 4, 'soldier', 'white');
    expect(proposeMoves(s, 4, 4)).toHaveLength(8);
  });
  it('promotes on the far row because it is pawn-family', () => {
    const s = emptyState();
    put(s, 1, 0, 'soldier', 'white');
    const after = applyMove(s, { from: [1, 0], to: [0, 0], mode: 'both' });
    expect(after.board[0][0]?.type).toBe('queen');
  });
});

describe('bully', () => {
  it('can move up to 3 squares forward on its first move', () => {
    const s = emptyState();
    put(s, 6, 3, 'bully', 'white');
    expect(targets(proposeMoves(s, 6, 3))).toEqual(['3,3', '4,3', '5,3']);
  });
  it('moves only 1 square after it has moved', () => {
    const s = emptyState();
    put(s, 5, 3, 'bully', 'white', true);
    expect(targets(proposeMoves(s, 5, 3))).toEqual(['4,3']);
  });
  it('captures straight ahead and stops there', () => {
    const s = emptyState();
    put(s, 6, 3, 'bully', 'white');
    put(s, 4, 3, 'pawn', 'black');
    expect(targets(proposeMoves(s, 6, 3))).toEqual(['4,3', '5,3']);
  });
  it('never captures diagonally', () => {
    const s = emptyState();
    put(s, 6, 3, 'bully', 'white');
    put(s, 5, 2, 'pawn', 'black');
    put(s, 5, 4, 'pawn', 'black');
    expect(targets(proposeMoves(s, 6, 3))).toEqual(['3,3', '4,3', '5,3']);
  });
  it('is blocked by its own piece', () => {
    const s = emptyState();
    put(s, 6, 3, 'bully', 'white');
    put(s, 5, 3, 'pawn', 'white');
    expect(proposeMoves(s, 6, 3)).toHaveLength(0);
  });
  it('moves down the board for black', () => {
    const s = emptyState('black');
    put(s, 1, 4, 'bully', 'black');
    expect(targets(proposeMoves(s, 1, 4))).toEqual(['2,4', '3,4', '4,4']);
  });
});

describe('jester', () => {
  it('has 4 orthogonal steps and 4 diagonal jumps from the middle', () => {
    const s = emptyState();
    put(s, 4, 4, 'jester', 'white');
    expect(proposeMoves(s, 4, 4)).toHaveLength(8);
  });
  it('jumps over pieces in the way', () => {
    const s = emptyState();
    put(s, 4, 4, 'jester', 'white');
    put(s, 3, 3, 'pawn', 'black');
    expect(targets(proposeMoves(s, 4, 4))).toContain('2,2');
  });
  it('cannot land on its own piece', () => {
    const s = emptyState();
    put(s, 4, 4, 'jester', 'white');
    put(s, 4, 5, 'pawn', 'white');
    expect(targets(proposeMoves(s, 4, 4))).not.toContain('4,5');
  });
});

describe('wizard', () => {
  it('reaches a bounce-only square that a plain bishop could not', () => {
    const s = emptyState();
    put(s, 4, 6, 'wizard', 'white');
    expect(targets(proposeMoves(s, 4, 6))).toContain('2,6');
  });
  it('reaches 19 squares from the middle, 13 from an edge, and 7 from a corner', () => {
    const count = (r: number, c: number) => {
      const s = emptyState();
      put(s, r, c, 'wizard', 'white');
      return proposeMoves(s, r, c).length;
    };
    expect(count(3, 3)).toBe(19);
    expect(count(0, 3)).toBe(13);
    expect(count(0, 0)).toBe(7);
  });
  it('averages about twice a bishop across the board (17.5 squares)', () => {
    let total = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const s = emptyState();
        put(s, r, c, 'wizard', 'white');
        total += proposeMoves(s, r, c).length;
      }
    }
    expect(total).toBe(1120);   // 17.5 x 64 squares
  });
  it('can capture an enemy piece but not land on its own', () => {
    const enemy = emptyState();
    put(enemy, 4, 6, 'wizard', 'white');
    put(enemy, 3, 7, 'pawn', 'black');
    expect(targets(proposeMoves(enemy, 4, 6))).toContain('3,7');
    const own = emptyState();
    put(own, 4, 6, 'wizard', 'white');
    put(own, 3, 7, 'pawn', 'white');
    expect(targets(proposeMoves(own, 4, 6))).not.toContain('3,7');
  });
  it('has no moves when all four diagonals are blocked by its own pieces', () => {
    const s = emptyState();
    put(s, 4, 6, 'wizard', 'white');
    put(s, 3, 7, 'pawn', 'white');
    put(s, 3, 5, 'pawn', 'white');
    put(s, 5, 7, 'pawn', 'white');
    put(s, 5, 5, 'pawn', 'white');
    expect(proposeMoves(s, 4, 6)).toHaveLength(0);
  });
});

describe('archer', () => {
  it('moves like a rook away from the back ranks', () => {
    const s = emptyState();
    put(s, 4, 3, 'archer', 'white');
    expect(proposeMoves(s, 4, 3)).toHaveLength(14);
  });
  it('also slides diagonally on its own back rank', () => {
    const s = emptyState();
    put(s, 7, 3, 'archer', 'white');
    expect(proposeMoves(s, 7, 3)).toHaveLength(21);
  });
  it('also slides diagonally on the enemy back rank', () => {
    const s = emptyState();
    put(s, 0, 3, 'archer', 'white');
    expect(proposeMoves(s, 0, 3)).toHaveLength(21);
  });
  it('counts as a rook-like partner for castling', () => {
    expect(hasTag({ type: 'archer', side: 'white', hasMoved: false }, 'rook-like')).toBe(true);
  });
});

describe('warden', () => {
  it('is the royal piece', () => {
    const s = emptyState();
    put(s, 4, 4, 'warden', 'white');
    expect(findKing(s, 'white')).toEqual([4, 4]);
  });
  it('moves like a king when its side is not behind', () => {
    const s = emptyState();
    put(s, 4, 4, 'warden', 'white');
    put(s, 7, 0, 'rook', 'white');
    put(s, 0, 7, 'rook', 'black');
    expect(proposeMoves(s, 4, 4)).toHaveLength(8);
  });
  it('reaches 2 squares in every direction while its side trails by 3 or more points', () => {
    const s = emptyState();
    put(s, 4, 4, 'warden', 'white');
    put(s, 0, 7, 'rook', 'black');
    expect(proposeMoves(s, 4, 4)).toHaveLength(16);
  });
  it('can make a capture illegal by waking up against the enemy king', () => {
    // Black's rook can take white's knight, but that leaves white 5 points behind,
    // which gives the Warden range 2 and puts it in line with the black king.
    const s = emptyState('black');
    put(s, 7, 4, 'warden', 'white');
    put(s, 7, 0, 'knight', 'white');
    put(s, 5, 4, 'king', 'black');
    put(s, 0, 0, 'rook', 'black');
    const rookTargets = targets(getLegalMoves(s, 0, 0));
    expect(rookTargets).not.toContain('7,0');
    expect(rookTargets).toContain('6,0');
  });
});
