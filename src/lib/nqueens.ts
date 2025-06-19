export interface QueenPosition {
  row: number;
  col: number;
}

function isSafe(board: number[], row: number, col: number, N: number): boolean {
  // Check this row on left side
  // Check upper diagonal on left side
  // Check lower diagonal on left side
  // No need to check column because we place one queen per row, and `board[i]` stores the column for row `i`.
  // The main check is for other queens in the same column or diagonals.
  for (let i = 0; i < row; i++) {
    if (board[i] === col || // Check if there is a queen in the same column
        board[i] - i === col - row || // Check upper-left diagonal
        board[i] + i === col + row) { // Check lower-left diagonal
      return false;
    }
  }
  return true;
}

function solveNQueensRecursive(
  board: number[],
  row: number,
  N: number,
  solutions: number[][]
): void {
  if (row === N) {
    solutions.push([...board]); // Store a copy of the solution
    return;
  }

  // Create a list of columns and shuffle them to explore different paths
  const columns = Array.from({ length: N }, (_, i) => i);
  // Ensure Math.random is only called client-side if this function could run on server.
  // However, this will be called from a client component event handler.
  //for (let i = columns.length - 1; i > 0; i--) {
  //  const j = Math.floor(Math.random() * (i + 1));
  //  [columns[i], columns[j]] = [columns[j], columns[i]];
  //}

  for (const col of columns) {
    if (isSafe(board, row, col, N)) {
      board[row] = col;
      solveNQueensRecursive(board, row + 1, N, solutions);
      // No need to explicitly backtrack (board[row] = -1) as we overwrite or finish the loop
    }
  }
}

export function solveNQueens(N: number): QueenPosition[] | null {
  const solutions: number[][] = [];
  const board = Array(N).fill(-1); // board[row] = column

  solveNQueensRecursive(board, 0, N, solutions);

  if (solutions.length > 0) {
    // Pick a random solution from those found
    const randomSolution = solutions[Math.floor(Math.random() * solutions.length)];
    return randomSolution.map((col, row) => ({ row, col }));
  }
  return null; // No solution found
}
