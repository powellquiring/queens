"use client";

import type { QueenPosition } from "@/lib/nqueens";
import { QueenIcon } from "./queen-icon";
import { cn } from "@/lib/utils";

interface ChessboardProps {
  boardSize?: number;
  queens: QueenPosition[];
  onSquareClick: (row: number, col: number) => void;
  className?: string;
}

export function Chessboard({
  boardSize = 8,
  queens,
  onSquareClick,
  className,
}: ChessboardProps) {
  const getSquareColor = (row: number, col: number) => {
    // Standard chessboard colors: light square for (0,0) or A8
    // User's background is light gray. We can use white and a slightly darker gray.
    // For example, white (hsl(0, 0%, 100%)) and a muted gray (hsl(0, 0%, 85%))
    // Or use theme colors if they fit: bg-card (white) and bg-muted (light gray)
    return (row + col) % 2 === 0 ? "bg-card" : "bg-muted";
  };

  const isQueenAt = (row: number, col: number) => {
    return queens.some(q => q.row === row && q.col === col);
  };

  return (
    <div
      className={cn(
        "grid gap-0.5 aspect-square shadow-lg rounded-md overflow-hidden border border-border",
        `grid-cols-${boardSize}`, // This class needs to be generated or safelisted
        className
      )}
      style={{ gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))` }}
      role="grid"
      aria-label={`Chessboard ${boardSize}x${boardSize}`}
    >
      {Array.from({ length: boardSize * boardSize }).map((_, index) => {
        const row = Math.floor(index / boardSize);
        const col = index % boardSize;
        const hasQueen = isQueenAt(row, col);
        const squareLabel = `${String.fromCharCode(65 + col)}${boardSize - row}`; // e.g., A8, B8 ... H1

        return (
          <button
            key={`${row}-${col}`}
            onClick={() => onSquareClick(row, col)}
            className={cn(
              "aspect-square flex items-center justify-center p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
              getSquareColor(row, col),
              "hover:bg-accent/20 transition-colors duration-150"
            )}
            aria-label={`Square ${squareLabel}, ${hasQueen ? "has a queen" : "empty"}`}
            role="gridcell"
          >
            <QueenIcon isVisible={hasQueen} className="w-3/4 h-3/4" />
          </button>
        );
      })}
    </div>
  );
}
