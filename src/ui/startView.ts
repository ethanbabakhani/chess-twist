import type { PickOrder } from '../engine/draft';
import { el } from './dom';

export type StartHandlers = {
  onDraft: (order: PickOrder) => void;
  onClassic: () => void;
  onSandbox: () => void;
};

export function mountStart(root: HTMLElement, handlers: StartHandlers): void {
  root.innerHTML = '';
  const screen = el('div', 'screen start');
  screen.append(el('h1', '', 'Chess Twist'), el('p', 'tagline', 'Draft your army, then play it.'));

  const orderRow = el('label', 'row', 'Pick order ');
  const select = el('select');
  select.innerHTML =
    '<option value="alternate">Alternate (White, Black, White, Black...)</option>' +
    '<option value="snake">Snake (White, Black, Black, White, White...)</option>';
  orderRow.append(select);

  const draftButton = el('button', 'btn primary', 'Start draft');
  draftButton.addEventListener('click', () => handlers.onDraft(select.value as PickOrder));

  const classicButton = el('button', 'btn', 'Classic chess');
  classicButton.addEventListener('click', handlers.onClassic);

  const sandboxButton = el('button', 'btn', 'Sandbox (every custom piece on the board)');
  sandboxButton.addEventListener('click', handlers.onSandbox);

  screen.append(orderRow, draftButton, classicButton, sandboxButton);
  root.append(screen);
}
