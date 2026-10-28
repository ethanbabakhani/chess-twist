import './style.css';
import { createInitialState, createSandboxState } from './engine/state';
import { mountBoard } from './ui/board';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = '<div id="board"></div><div id="status"></div>';
const sandbox = new URLSearchParams(window.location.search).has('sandbox');
mountBoard(
  document.querySelector<HTMLElement>('#board')!,
  document.querySelector<HTMLElement>('#status')!,
  sandbox ? createSandboxState() : createInitialState()
);
