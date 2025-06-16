"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chessboard } from "@/components/chessboard";
import { solveNQueens, type QueenPosition } from "@/lib/nqueens";
import { Sparkles, Trash2 } from "lucide-react";

const BOARD_SIZE = 8;

export default function HomePage() {
  const [queens, setQueens] = useState<QueenPosition[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Welcome! Click 'Solve' or place queens manually.");

  useEffect(() => {
    setIsClient(true);
    // Initial solve when component mounts and client is ready
    // handleSolve(); // Uncomment if you want board solved on load
  }, []);

  const handleSolve = () => {
    if (!isClient) return; 
    const solution = solveNQueens(BOARD_SIZE);
    if (solution) {
      setQueens(solution);
      setStatusMessage("Puzzle solved! A random solution is displayed.");
    } else {
      setQueens([]); 
      setStatusMessage("No solution found for this board size.");
    }
  };

  const handleClear = () => {
    setQueens([]);
    setStatusMessage("Board cleared. Place queens or click 'Solve'.");
  };

  const handleSquareClick = (row: number, col: number) => {
    setQueens(prevQueens => {
      const isQueenPresent = prevQueens.some(q => q.row === row && q.col === col);
      const squareName = `${String.fromCharCode(65 + col)}${BOARD_SIZE - row}`;
      if (isQueenPresent) {
        setStatusMessage(`Queen removed from ${squareName}.`);
        return prevQueens.filter(q => !(q.row === row && q.col === col));
      } else {
        // For N-Queens, generally, one queen per row/column.
        // This simple interaction allows free placement.
        // Check if a queen already exists in this row or column for strict N-Queens user placement.
        // const queenInRow = prevQueens.some(q => q.row === row);
        // const queenInCol = prevQueens.some(q => q.col === col);
        // if(queenInRow || queenInCol) {
        //   setStatusMessage(`Cannot place queen at ${squareName}, another queen conflicts in row/column.`);
        //   return prevQueens;
        // }
        setStatusMessage(`Queen placed at ${squareName}.`);
        return [...prevQueens, { row, col }];
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 selection:bg-accent/30 bg-background">
      <Card className="w-full max-w-lg shadow-2xl rounded-xl bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-center text-3xl font-headline font-bold text-primary tracking-tight">
            Queen's Gambit Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-6">
          {isClient ? (
            <Chessboard
              boardSize={BOARD_SIZE}
              queens={queens}
              onSquareClick={handleSquareClick}
              className="w-full max-w-md border-2 border-primary/20 rounded-lg"
            />
          ) : (
            <div className="w-full max-w-md aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Loading Chessboard...</p>
            </div>
          )}
           <p className="text-sm text-muted-foreground min-h-[20px] text-center" aria-live="polite">
            {statusMessage}
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
          <Button onClick={handleSolve} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90 text-primary-foreground">
            <Sparkles className="mr-2 h-5 w-5" /> Solve Puzzle
          </Button>
          <Button onClick={handleClear} variant="secondary" className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow">
            <Trash2 className="mr-2 h-5 w-5" /> Clear Board
          </Button>
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Interactively explore the N-Queens problem. Place queens by clicking on squares.</p>
        <p>Use controls to solve or clear the board. Chessboard is {BOARD_SIZE}x{BOARD_SIZE}.</p>
      </footer>
    </div>
  );
}
