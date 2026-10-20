import './style.css';
import { createInitialState } from './engine/state';
import { mountBoard } from './ui/board';

const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = '<div id="board"></div><div id="status"></div>';
mountBoard(
  document.querySelector<HTMLElement>('#board')!,
  document.querySelector<HTMLElement>('#status')!,
  createInitialState()
);
