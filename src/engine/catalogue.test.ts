import { describe, it, expect } from 'vitest';
import { CATALOGUE, familyOf, hasTag } from './catalogue';
import type { Piece } from './types';

const piece = (type: string): Piece => ({ type, side: 'white', hasMoved: false });

describe('piece families and tags', () => {
  it('puts the standard pieces in the expected families', () => {
    const fam = (t: string) => CATALOGUE[t].family;
    expect([fam('king'), fam('queen'), fam('pawn'), fam('knight'), fam('bishop'), fam('rook')])
      .toEqual(['king', 'queen', 'pawn', 'skill', 'skill', 'skill']);
  });
  it('gives only the rook the rook-like tag', () => {
    expect(hasTag(piece('rook'), 'rook-like')).toBe(true);
    expect(hasTag(piece('bishop'), 'rook-like')).toBe(false);
    expect(hasTag(piece('queen'), 'rook-like')).toBe(false);
  });
  it('treats unknown types as having no family and no tags', () => {
    expect(familyOf(piece('mystery'))).toBeNull();
    expect(hasTag(piece('mystery'), 'rook-like')).toBe(false);
  });
});
