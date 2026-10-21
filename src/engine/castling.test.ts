import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import { CATALOGUE } from './catalogue';
import { applyMove, getLegalMoves, getStatus } from './rules';
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

// White king on e1 with rooks in both corners, plus a black king out of the way
function whiteSetup(): GameState {
  const s = emptyState();
  put(s, 7, 4, 'king', 'white');
  put(s, 7, 0, 'rook', 'white');
  put(s, 7, 7, 'rook', 'white');
  put(s, 0, 0, 'king', 'black');
  return s;
}

const castles = (s: GameState): Move[] => getLegalMoves(s, 7, 4).filter(m => m.castle);
const targets = (moves: Move[]) => moves.map(m => `${m.to[0]},${m.to[1]}`).sort();

describe('castling', () => {
  it('is offered on both sides when the path is clear', () => {
    expect(targets(castles(whiteSetup()))).toEqual(['7,2', '7,6']);
  });

  it('moves both the king and the rook (kingside)', () => {
    const s = whiteSetup();
    const move = castles(s).find(m => m.to[1] === 6)!;
    const after = applyMove(s, move);
    expect(after.board[7][6]?.type).toBe('king');
    expect(after.board[7][5]?.type).toBe('rook');
    expect(after.board[7][4]).toBeNull();
    expect(after.board[7][7]).toBeNull();
    expect(after.board[7][5]?.hasMoved).toBe(true);
    expect(s.board[7][4]?.type).toBe('king');   // original untouched
  });

  it('moves both the king and the rook (queenside)', () => {
    const s = whiteSetup();
    const move = castles(s).find(m => m.to[1] === 2)!;
    const after = applyMove(s, move);
    expect(after.board[7][2]?.type).toBe('king');
    expect(after.board[7][3]?.type).toBe('rook');
    expect(after.board[7][4]).toBeNull();
    expect(after.board[7][0]).toBeNull();
  });

  it('is blocked by any piece between the king and the rook', () => {
    const s = whiteSetup();
    put(s, 7, 5, 'bishop', 'white');
    expect(targets(castles(s))).toEqual(['7,2']);
  });

  it('is blocked on the queenside by a piece next to the rook', () => {
    const s = whiteSetup();
    put(s, 7, 1, 'knight', 'white');
    expect(targets(castles(s))).toEqual(['7,6']);
  });

  it('is not allowed after the king has moved', () => {
    const s = whiteSetup();
    put(s, 7, 4, 'king', 'white', true);
    expect(castles(s)).toHaveLength(0);
  });

  it('is not allowed with a rook that has moved', () => {
    const s = whiteSetup();
    put(s, 7, 7, 'rook', 'white', true);
    expect(targets(castles(s))).toEqual(['7,2']);
  });

  it('is not allowed out of check', () => {
    const s = whiteSetup();
    put(s, 0, 4, 'rook', 'black');
    expect(castles(s)).toHaveLength(0);
  });

  it('is not allowed through an attacked square', () => {
    const s = whiteSetup();
    put(s, 0, 5, 'rook', 'black');
    expect(targets(castles(s))).toEqual(['7,2']);
  });

  it('is not allowed onto an attacked square', () => {
    const s = whiteSetup();
    put(s, 0, 6, 'rook', 'black');
    expect(targets(castles(s))).toEqual(['7,2']);
  });

  it('is still allowed queenside when only the rook-side square is attacked', () => {
    const s = whiteSetup();
    put(s, 0, 1, 'rook', 'black');
    expect(targets(castles(s))).toEqual(['7,2', '7,6']);
  });

  it('needs a rook-like partner in the corner', () => {
    const s = whiteSetup();
    put(s, 7, 7, 'knight', 'white');
    expect(targets(castles(s))).toEqual(['7,2']);
  });

  it('works with a custom piece that carries the rook-like tag', () => {
    CATALOGUE.cannon = { family: 'skill', tags: ['rook-like'], baseMoves: () => [] };
    const s = whiteSetup();
    put(s, 7, 7, 'cannon', 'white');
    expect(targets(castles(s))).toEqual(['7,2', '7,6']);
    delete CATALOGUE.cannon;
  });

  it('works for black on its own back row', () => {
    const s = emptyState('black');
    put(s, 0, 4, 'king', 'black');
    put(s, 0, 7, 'rook', 'black');
    put(s, 7, 0, 'king', 'white');
    const moves = getLegalMoves(s, 0, 4).filter(m => m.castle);
    expect(targets(moves)).toEqual(['0,6']);
  });

  it('does not recurse forever when both kings could castle', () => {
    const s = emptyState();
    put(s, 7, 4, 'king', 'white');
    put(s, 7, 0, 'rook', 'white');
    put(s, 7, 7, 'rook', 'white');
    put(s, 0, 4, 'king', 'black');
    put(s, 0, 0, 'rook', 'black');
    put(s, 0, 7, 'rook', 'black');
    expect(getStatus(s)).toBe('playing');
  });
});
