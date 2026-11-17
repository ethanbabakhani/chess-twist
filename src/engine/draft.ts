import { CATALOGUE, type Family } from './catalogue';
import type { GameState, Piece, Side } from './types';

export const DRAFT_BUDGET = 39;       // the value of a standard army
export const CUSTOM_COPY_LIMIT = 2;   // copies of each custom piece in the shared pool
export const SLOT_COUNTS: Record<Family, number> = { king: 1, queen: 1, pawn: 8, skill: 6 };

const FAMILIES: Family[] = ['king', 'queen', 'pawn', 'skill'];
const STANDARD_TYPES = new Set(['king', 'queen', 'rook', 'bishop', 'knight', 'pawn']);

// Columns a piece may start in (default: anywhere in its row)
const PLACEMENT_COLUMNS: Record<string, number[]> = { bully: [3, 4] };

// Back-rank columns for skill pieces: corners first, then the knights' squares, then the bishops'
const SKILL_COLUMNS = [0, 7, 1, 6, 2, 5];

export type PickOrder = 'alternate' | 'snake';

export type DraftState = {
  order: Side[];                    // whose pick it is at every step
  step: number;                     // index into order
  picks: Record<Side, string[]>;    // piece types, in pick order
  budgetLeft: Record<Side, number>;
  taken: Record<string, number>;    // copies of each type taken so far, both sides combined
};

export type PickCheck = { ok: true } | { ok: false; reason: string };

export function makePickOrder(mode: PickOrder): Side[] {
  const total = 2 * FAMILIES.reduce((sum, f) => sum + SLOT_COUNTS[f], 0);
  const order: Side[] = [];
  for (let i = 0; i < total; i++) {
    const round = Math.floor(i / 2);
    const first: Side = mode === 'snake' && round % 2 === 1 ? 'black' : 'white';
    const second: Side = first === 'white' ? 'black' : 'white';
    order.push(i % 2 === 0 ? first : second);
  }
  return order;
}

export function createDraft(mode: PickOrder = 'alternate'): DraftState {
  return {
    order: makePickOrder(mode),
    step: 0,
    picks: { white: [], black: [] },
    budgetLeft: { white: DRAFT_BUDGET, black: DRAFT_BUDGET },
    taken: {},
  };
}

export function isDraftComplete(draft: DraftState): boolean {
  return draft.step >= draft.order.length;
}

export function currentPicker(draft: DraftState): Side | null {
  return isDraftComplete(draft) ? null : draft.order[draft.step];
}

export function slotsUsed(draft: DraftState, side: Side): Record<Family, number> {
  const used: Record<Family, number> = { king: 0, queen: 0, pawn: 0, skill: 0 };
  for (const type of draft.picks[side]) used[CATALOGUE[type].family] += 1;
  return used;
}

export function copyLimitOf(type: string): number {
  return STANDARD_TYPES.has(type) ? Infinity : CUSTOM_COPY_LIMIT;
}

export function copiesLeft(draft: DraftState, type: string): number {
  return copyLimitOf(type) - (draft.taken[type] ?? 0);
}

// The cheapest unlimited (standard) piece in a family: what a player can always fall back on
function cheapestFill(family: Family): number {
  let best = Infinity;
  for (const type of STANDARD_TYPES) {
    const def = CATALOGUE[type];
    if (def && def.family === family) best = Math.min(best, def.value ?? 0);
  }
  return best;
}

function minToFill(used: Record<Family, number>): number {
  let total = 0;
  for (const f of FAMILIES) total += (SLOT_COUNTS[f] - used[f]) * cheapestFill(f);
  return total;
}

export function canPick(draft: DraftState, type: string): PickCheck {
  const side = currentPicker(draft);
  if (!side) return { ok: false, reason: 'The draft is finished' };
  const def = CATALOGUE[type];
  if (!def) return { ok: false, reason: 'Unknown piece' };

  const used = slotsUsed(draft, side);
  if (used[def.family] >= SLOT_COUNTS[def.family]) {
    return { ok: false, reason: `All ${def.family} slots are full` };
  }
  if (copiesLeft(draft, type) <= 0) return { ok: false, reason: 'No copies left' };

  const allowed = PLACEMENT_COLUMNS[type];
  if (allowed && draft.picks[side].filter(t => t === type).length >= allowed.length) {
    return { ok: false, reason: 'No starting squares left for it' };
  }

  // After this pick, the player must still be able to afford the cheapest army that fills every slot
  used[def.family] += 1;
  if (draft.budgetLeft[side] - (def.value ?? 0) < minToFill(used)) {
    return { ok: false, reason: 'Not enough points left to fill your army' };
  }
  return { ok: true };
}

// Returns the new draft state, or null if the pick is not allowed
export function pick(draft: DraftState, type: string): DraftState | null {
  if (!canPick(draft, type).ok) return null;
  const side = draft.order[draft.step];
  const next = structuredClone(draft);
  next.picks[side].push(type);
  next.budgetLeft[side] -= CATALOGUE[type].value ?? 0;
  next.taken[type] = (next.taken[type] ?? 0) + 1;
  next.step += 1;
  return next;
}

function skillRank(type: string): number {
  const tags = CATALOGUE[type]?.tags ?? [];
  if (tags.includes('rook-like')) return 0;
  if (tags.includes('knight-like')) return 1;
  if (tags.includes('bishop-like')) return 2;
  return 3;
}

// Turns a list of picks into piece types for each column of the back rank and the pawn row
export function layoutArmy(types: string[]): { backRank: (string | null)[]; pawnRow: (string | null)[] } {
  const backRank: (string | null)[] = Array(8).fill(null);
  const pawnRow: (string | null)[] = Array(8).fill(null);
  const byFamily = (f: Family) => types.filter(t => CATALOGUE[t]?.family === f);

  const king = byFamily('king')[0];
  const queen = byFamily('queen')[0];
  if (king) backRank[4] = king;
  if (queen) backRank[3] = queen;

  const skills = byFamily('skill')
    .map((type, index) => ({ type, index }))
    .sort((a, b) => skillRank(a.type) - skillRank(b.type) || a.index - b.index)
    .map(entry => entry.type);
  skills.forEach((type, i) => { backRank[SKILL_COLUMNS[i]] = type; });

  const pawns = byFamily('pawn');
  const restricted = pawns.filter(t => PLACEMENT_COLUMNS[t]);
  const free = pawns.filter(t => !PLACEMENT_COLUMNS[t]);
  for (const type of restricted) {
    const col = PLACEMENT_COLUMNS[type].find(c => pawnRow[c] === null);
    if (col !== undefined) pawnRow[col] = type;
    else free.push(type);
  }
  for (const type of free) {
    const col = pawnRow.indexOf(null);
    if (col !== -1) pawnRow[col] = type;
  }
  return { backRank, pawnRow };
}

export function buildGame(draft: DraftState): GameState {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const side of ['white', 'black'] as const) {
    const { backRank, pawnRow } = layoutArmy(draft.picks[side]);
    const backIndex = side === 'white' ? 7 : 0;
    const pawnIndex = side === 'white' ? 6 : 1;
    for (let c = 0; c < 8; c++) {
      const back = backRank[c];
      if (back) board[backIndex][c] = { type: back, side, hasMoved: false };
      const front = pawnRow[c];
      if (front) board[pawnIndex][c] = { type: front, side, hasMoved: false };
    }
  }
  return { board, turn: 'white', turnCount: 0, effects: [] };
}
