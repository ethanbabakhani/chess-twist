import './style.css';
import { createInitialState, createSandboxState } from './engine/state';
import { mountBoard } from './ui/board';
import { mountDraft } from './ui/draftView';
import { mountStart } from './ui/startView';
import type { GameState } from './engine/types';

const app = document.querySelector<HTMLDivElement>('#app')!;

function showStart(): void {
  mountStart(app, {
    onDraft: order => mountDraft(app, order, showGame, showStart),
    onClassic: () => showGame(createInitialState()),
    onSandbox: () => showGame(createSandboxState()),
  });
}

function showGame(state: GameState): void {
  app.innerHTML = '<div id="board"></div><div id="status"></div><button id="menu" class="btn">Back to menu</button>';
  mountBoard(
    document.querySelector<HTMLElement>('#board')!,
    document.querySelector<HTMLElement>('#status')!,
    state
  );
  document.querySelector<HTMLButtonElement>('#menu')!.addEventListener('click', showStart);
}

showStart();
