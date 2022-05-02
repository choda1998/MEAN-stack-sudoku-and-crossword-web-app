export interface SudokuCell {
  sudoku_id: number;
  index: number;
  value: number | undefined;
  difficulty: number;
}
