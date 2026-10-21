export type Side = 'white' | 'black';
export type Square = [row: number, col: number];   // row 0 is the top of the board
export type Offset = [dr: number, dc: number];     // a row/column step, like [-2, 1]

export type Piece = {
  type: string;      // key into the catalogue, e.g. 'knight'
  side: Side;
  hasMoved: boolean;
};

export type Move = {
  from: Square;
  to: Square;
  mode: 'move' | 'capture' | 'both';
  castle?: { rookFrom: Square; rookTo: Square };   // set only on castling moves
};

export type Effect = { kind: string; square?: Square; turnsLeft: number };

export type GameState = {
  board: (Piece | null)[][];   // null means an empty square
  turn: Side;
  turnCount: number;
  effects: Effect[];           // blocked tiles, locked pawns, etc. (empty for now)
};
