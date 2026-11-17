import { CATALOGUE, type Family } from '../engine/catalogue';
import {
  SLOT_COUNTS, buildGame, canPick, copiesLeft, createDraft, currentPicker,
  isDraftComplete, pick, slotsUsed, type DraftState, type PickOrder,
} from '../engine/draft';
import type { GameState, Side } from '../engine/types';
import { el } from './dom';
import { DESCRIPTIONS, displayName, labelFor } from './pieces';

const FAMILY_ORDER: Family[] = ['king', 'queen', 'skill', 'pawn'];
const FAMILY_NAMES: Record<Family, string> = { king: 'King', queen: 'Queen', skill: 'Skill', pawn: 'Pawn' };
const SIDE_NAMES: Record<Side, string> = { white: 'White', black: 'Black' };

export function mountDraft(
  root: HTMLElement,
  order: PickOrder,
  onDone: (state: GameState) => void,
  onBack: () => void
): void {
  let draft: DraftState = createDraft(order);

  function sidePanel(side: Side): HTMLElement {
    const panel = el('div', 'panel');
    panel.classList.toggle('active', currentPicker(draft) === side);
    panel.append(el('h3', '', `${SIDE_NAMES[side]}: ${draft.budgetLeft[side]} points left`));

    const used = slotsUsed(draft, side);
    const summary = FAMILY_ORDER.map(f => `${FAMILY_NAMES[f]} ${used[f]}/${SLOT_COUNTS[f]}`).join(' · ');
    panel.append(el('div', 'slots', summary));

    const chips = el('div', 'chips');
    for (const type of draft.picks[side]) {
      const label = labelFor(type, side);
      const chip = el('span', label.custom ? `chip custom ${side}` : 'chip', label.text);
      chip.title = displayName(type);
      chips.append(chip);
    }
    panel.append(chips);
    return panel;
  }

  function pool(): HTMLElement {
    const wrap = el('div', 'pool');
    const types = Object.keys(CATALOGUE).sort(
      (a, b) =>
        FAMILY_ORDER.indexOf(CATALOGUE[a].family) - FAMILY_ORDER.indexOf(CATALOGUE[b].family) ||
        (CATALOGUE[a].value ?? 0) - (CATALOGUE[b].value ?? 0)
    );
    for (const type of types) {
      const def = CATALOGUE[type];
      const check = canPick(draft, type);
      const left = copiesLeft(draft, type);

      const card = el('button', 'card');
      card.disabled = !check.ok;
      if (!check.ok) card.title = check.reason;

      const label = labelFor(type, 'white');
      card.append(el('span', label.custom ? 'card-icon text' : 'card-icon', label.text));

      const info = el('span', 'card-info');
      info.append(el('span', 'card-name', displayName(type)));
      const meta = `${def.value ?? 0} pts · ${FAMILY_NAMES[def.family]}` + (Number.isFinite(left) ? ` · ${left} left` : '');
      info.append(el('span', 'card-meta', meta));
      info.append(el('span', 'card-desc', DESCRIPTIONS[type] ?? ''));
      card.append(info);

      card.addEventListener('click', () => {
        const next = pick(draft, type);
        if (next) {
          draft = next;
          render();
        }
      });
      wrap.append(card);
    }
    return wrap;
  }

  function render(): void {
    root.innerHTML = '';
    const screen = el('div', 'screen draft');
    const picker = currentPicker(draft);
    const heading = picker
      ? `${SIDE_NAMES[picker]} to pick (${draft.step + 1} of ${draft.order.length})`
      : 'Draft complete';
    screen.append(el('h2', '', heading));

    const panels = el('div', 'panels');
    panels.append(sidePanel('white'), sidePanel('black'));
    screen.append(panels);

    if (isDraftComplete(draft)) {
      const begin = el('button', 'btn primary', 'Begin game');
      begin.addEventListener('click', () => onDone(buildGame(draft)));
      screen.append(begin);
    } else {
      screen.append(pool());
    }

    const back = el('button', 'btn', 'Back to menu');
    back.addEventListener('click', onBack);
    screen.append(back);
    root.append(screen);
  }

  render();
}
