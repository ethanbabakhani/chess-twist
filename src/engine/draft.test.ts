import { describe, it, expect } from 'vitest';
import { createInitialState } from './state';
import {
  buildGame, canPick, createDraft, currentPicker, isDraftComplete, layoutArmy,
  makePickOrder, pick, type DraftState, type PickOrder,
} from './draft';
import type { Side } from './types';

const STANDARD_ARMY = [
  'king', 'queen', 'rook', 'rook', 'knight', 'knight', 'bishop', 'bishop',
  'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn',
];

// Plays a whole draft, each side taking its list in order
function runDraft(white: string[], black: string[], mode: PickOrder = 'alternate'): DraftState {
  let draft = createDraft(mode);
  const queues: Record<Side, string[]> = { white: [...white], black: [...black] };
  while (!isDraftComplete(draft)) {
    const side = currentPicker(draft)!;
    const type = queues[side].shift()!;
    const next = pick(draft, type);
    if (!next) throw new Error(`illegal pick: ${type} for ${side}`);
    draft = next;
  }
  return draft;
}

describe('pick order', () => {
  it('has 32 picks, 16 each, alternating from white', () => {
    const order = makePickOrder('alternate');
    expect(order).toHaveLength(32);
    expect(order.filter(s => s === 'white')).toHaveLength(16);
    expect(order.slice(0, 4)).toEqual(['white', 'black', 'white', 'black']);
  });
  it('snake order goes white, black, black, white, white, black...', () => {
    expect(makePickOrder('snake').slice(0, 8))
      .toEqual(['white', 'black', 'black', 'white', 'white', 'black', 'black', 'white']);
    expect(makePickOrder('snake').filter(s => s === 'white')).toHaveLength(16);
  });
});

describe('a full draft', () => {
  it('lets both sides draft the standard army, spending exactly 39 points', () => {
    const draft = runDraft(STANDARD_ARMY, STANDARD_ARMY);
    expect(isDraftComplete(draft)).toBe(true);
    expect(draft.budgetLeft).toEqual({ white: 0, black: 0 });
  });
  it('builds exactly the standard starting position from the standard army', () => {
    const draft = runDraft(STANDARD_ARMY, STANDARD_ARMY);
    expect(buildGame(draft)).toEqual(createInitialState());
  });
  it('allows no picks after the draft is finished', () => {
    const draft = runDraft(STANDARD_ARMY, STANDARD_ARMY);
    expect(pick(draft, 'pawn')).toBeNull();
  });
});

describe('pick rules', () => {
  it('rejects a second queen for the same side because the slot is full', () => {
    let d = createDraft();
    d = pick(d, 'queen')!;     // white
    d = pick(d, 'pawn')!;      // black
    expect(pick(d, 'queen')).toBeNull();
    expect(canPick(d, 'queen')).toEqual({ ok: false, reason: 'All queen slots are full' });
  });
  it('shares custom copies between both sides (limit 2)', () => {
    let d = createDraft();
    d = pick(d, 'wizard')!;    // white
    d = pick(d, 'wizard')!;    // black
    expect(canPick(d, 'wizard')).toEqual({ ok: false, reason: 'No copies left' });
  });
  it('never limits standard pieces', () => {
    let d = createDraft();
    d = pick(d, 'pawn')!;
    d = pick(d, 'pawn')!;
    d = pick(d, 'pawn')!;
    expect(canPick(d, 'pawn').ok).toBe(true);
  });
  it('rejects a pick that would leave too few points to fill the army', () => {
    let d = createDraft();
    d = pick(d, 'archer')!;    // white: 33 left, cheapest remaining army costs 32
    d = pick(d, 'pawn')!;      // black
    expect(canPick(d, 'archer')).toEqual({ ok: false, reason: 'Not enough points left to fill your army' });
  });
  it('lets a cheap piece make room for an expensive one', () => {
    let d = createDraft();
    d = pick(d, 'jester')!;    // white: 37 left
    d = pick(d, 'pawn')!;      // black
    d = pick(d, 'jester')!;    // white: 35 left
    d = pick(d, 'pawn')!;      // black
    expect(canPick(d, 'archer').ok).toBe(true);
  });
});

describe('army layout', () => {
  it('puts rook-like pieces in the corners, then knight-like, then bishop-like', () => {
    const { backRank } = layoutArmy(['king', 'queen', 'bishop', 'knight', 'archer', 'rook', 'jester', 'knight']);
    expect(backRank[0]).toBe('archer');
    expect(backRank[7]).toBe('rook');
    expect(backRank[1]).toBe('knight');
    expect(backRank[6]).toBe('knight');
    expect(backRank[2]).toBe('bishop');
    expect(backRank[5]).toBe('jester');
    expect(backRank[3]).toBe('queen');
    expect(backRank[4]).toBe('king');
  });
  it('puts Bullies on the d and e files', () => {
    const { pawnRow } = layoutArmy(['bully', 'pawn', 'pawn', 'bully', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn']);
    expect(pawnRow[3]).toBe('bully');
    expect(pawnRow[4]).toBe('bully');
    expect(pawnRow.filter(t => t === 'pawn')).toHaveLength(6);
  });
  it('fills the pawn row without gaps', () => {
    const { pawnRow } = layoutArmy(['soldier', 'bully', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn', 'pawn']);
    expect(pawnRow.every(t => t !== null)).toBe(true);
  });
});
