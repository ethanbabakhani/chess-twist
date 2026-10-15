import type { GameState, Move } from '../engine/types';
import { proposeMoves } from '../engine/catalogue';
import { applyMove } from '../engine/rules';

const GLYPHS: Record<string, string> = {
  'white-king': '♔', 'white-queen': '♕', 'white-rook': '♖', 'white-bishop': '♗', 'white-knight': '♘', 'white-pawn': '♙',
  'black-king': '♚', 'black-queen': '♛', 'black-rook': '♜', 'black-bishop': '♝', 'black-knight': '♞', 'black-pawn': '♟',
};

export function mountBoard(container: HTMLElement, initialState: GameState): void {
  let state = initialState;
  let selected: [number, number] | null = null;
  let highlights: Move[] = [];

  function render(): void {
    container.innerHTML = '';
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const square = document.createElement('div');
        square.className = 'square ' + ((r + c) % 2 === 0 ? 'light' : 'dark');
        if (selected && selected[0] === r && selected[1] === c) square.classList.add('selected');
        if (highlights.some(m => m.to[0] === r && m.to[1] === c)) square.classList.add('target');
        const piece = state.board[r][c];
        if (piece) square.textContent = GLYPHS[`${piece.side}-${piece.type}`] ?? '?';
        square.addEventListener('click', () => onClick(r, c));
        container.appendChild(square);
      }
    }
  }

  function onClick(r: number, c: number): void {
    const chosen = highlights.find(m => m.to[0] === r && m.to[1] === c);
    if (chosen) {
      state = applyMove(state, chosen);
      selected = null;
      highlights = [];
      render();
      return;
    }
    const piece = state.board[r][c];
    if (piece && piece.side === state.turn) {
      selected = [r, c];
      highlights = proposeMoves(state, r, c);
    } else {
      selected = null;
      highlights = [];
    }
    render();
  }

  render();
}
