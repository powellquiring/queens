"use client";

import type { QueenPosition } from "@/lib/nqueens";
import { QueenIcon } from "./queen-icon";
import { cn } from "@/lib/utils";

interface ChessboardProps {
  boardSize?: number;
  queens: QueenPosition[];
  safetyMap?: boolean[][];
  highlightedSquare?: {row: number, col: number} | null;
  onSquareClick: (row: number, col: number) => void;
  className?: string;
}

export function Chessboard({
  boardSize = 8,
  queens,
  safetyMap,
  highlightedSquare,
  onSquareClick,
  className,
}: ChessboardProps) {
  const getSquareColor = (row: number, col: number) => {
    // If this is the highlighted square, show it in red
    if (highlightedSquare && highlightedSquare.row === row && highlightedSquare.col === col) {
      return "bg-red-500";
    }
    
    // Base color based on checkerboard pattern
    const baseColor = (row + col) % 2 === 0 ? "bg-card" : "bg-muted";
    
    // If we have a safety map and the square is not safe, add a visual indicator
    if (safetyMap && !safetyMap[row][col]) {
      return cn(baseColor, "border-red-400 border");
    }
    
    return baseColor;
  };

  const isQueenAt = (row: number, col: number) => {
    return queens.some(q => q.row === row && q.col === col);
  };

  return (
    <div
      className={cn(
        "grid gap-0.5 aspect-square shadow-lg rounded-md overflow-hidden border border-border",
        `grid-cols-${boardSize}`,
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
        const isSafe = !safetyMap || safetyMap[row][col];
        const squareLabel = `${String.fromCharCode(65 + col)}${boardSize - row}`; // e.g., A8, B8 ... H1

        return (
          <button
            key={`${row}-${col}`}
            onClick={() => onSquareClick(row, col)}
            className={cn(
              "aspect-square flex items-center justify-center p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-sm",
              getSquareColor(row, col),
              // Change hover color based on safety
              isSafe ? "hover:bg-accent/20" : "hover:bg-red-400/50",
              "transition-colors duration-150",
              !isSafe && !hasQueen && "after:content-['×'] after:text-red-500 after:opacity-50 after:text-lg after:font-bold"
            )}
            aria-label={`Square ${squareLabel}, ${hasQueen ? "has a queen" : isSafe ? "empty" : "under attack"}`}
            role="gridcell"
          >
            <QueenIcon isVisible={hasQueen} className="w-3/4 h-3/4" />
          </button>
        );
      })}
    </div>
  );
}
