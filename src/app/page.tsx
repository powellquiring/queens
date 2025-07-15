"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Chessboard } from "@/components/chessboard";
import { type QueenPosition } from "@/lib/nqueens";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Trash2, ChevronRight, Square, Play, FastForward } from "lucide-react";

const BOARD_SIZE = 8;

export default function HomePage() {
  const [queens, setQueens] = useState<QueenPosition[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Welcome! Click 'Solve' or place queens manually.");
  const [safetyMap, setSafetyMap] = useState<boolean[][]>(Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(true)));
  // Add a new state to track temporarily highlighted squares
  const [highlightedSquare, setHighlightedSquare] = useState<{row: number, col: number} | null>(null);
  const [isToastActive, setIsToastActive] = useState(false);

  // New state variables for solve control
  const [isSolving, setIsSolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [solveState, setSolveState] = useState<{
    attempts: number;
    currentQueens: QueenPosition[];
  } | null>(null);

  // Use ref for immediate stop signal that can be checked in async loops
  const shouldStopRef = useRef(false);
  const shouldFinishRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    // Initial solve when component mounts and client is ready
    // handleSolve(); // Uncomment if you want board solved on load
  }, []);

  // Check if all 8 queens are placed and display "Solved!" message
  useEffect(() => {
    if (queens.length === BOARD_SIZE) {
      setStatusMessage("Solved!");
      setIsToastActive(true);

      toast({
        title: "🎉 Congratulations!",
        description: "You've successfully solved the 8-Queens puzzle!",
        duration: 3000, // 3 seconds
      });

      // Disable input for 3 seconds
      setTimeout(() => {
        setIsToastActive(false);
      }, 3000);
    }
  }, [queens, toast]);

  const handleSolve = async (withDelay: boolean = true) => {
    if (!isClient || isToastActive) return;

    setIsSolving(true);
    shouldStopRef.current = false;
    shouldFinishRef.current = false;
    setIsPaused(false);
    setStatusMessage("Solving puzzle step by step...");

    let attempts = solveState?.attempts || 0;
    const maxAttempts = 1000; // Prevent infinite loops
    let currentQueens: QueenPosition[] = solveState?.currentQueens || [...queens]; // Start with current queens state or resume from saved state

    // Clear saved state since we're starting/resuming
    setSolveState(null);

    // Repeatedly call the common logic until all 8 queens are placed
    while (currentQueens.length < BOARD_SIZE && attempts < maxAttempts && !shouldStopRef.current) {
      attempts++;

      const result = placeOrMoveNextQueen(currentQueens);

      if (!result.success) {
        // No solution possible
        setStatusMessage("No solution found for this board size.");
        setIsSolving(false);
        return;
      }

      // Update local queens from the result
      currentQueens = result.newQueens;

      // Update message to show solving progress
      if (result.message.includes("placed")) {
        setStatusMessage(`Solving... Queen ${currentQueens.length} ${result.message.split(' ').slice(2).join(' ')}`);
      } else {
        setStatusMessage(result.message);
      }

      // Check if we should stop before the delay
      if (shouldStopRef.current) {
        setIsSolving(false);

        // If finish was requested, immediately continue without delays
        if (shouldFinishRef.current) {
          shouldFinishRef.current = false;
          setSolveState({ attempts, currentQueens });
          setIsPaused(true);
          setStatusMessage("Finishing solve without delays...");
          setTimeout(() => handleSolve(false), 10);
          return;
        }

        // If it's a true stop (not finish), check if we should save state
        if (isPaused || solveState) {
          // This was a pause request, save state
          setSolveState({ attempts, currentQueens });
          setIsPaused(true);
          setStatusMessage("Solving paused. Choose an option to continue.");
        } else {
          // This was a stop request, don't save state
          shouldStopRef.current = false;
          setStatusMessage("Solving stopped. Current state preserved.");
        }
        return;
      }

      // Add a small delay to make the solving process visible (only if withDelay is true)
      if (withDelay) {
        const delay = result.message.includes("Backtracking") ? 200 : 300;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setIsSolving(false);
    if (currentQueens.length === BOARD_SIZE) {
      setStatusMessage("Puzzle solved step by step!");
    } else if (shouldStopRef.current) {
      // If finish was requested, immediately continue without delays
      if (shouldFinishRef.current) {
        shouldFinishRef.current = false;
        setSolveState({ attempts, currentQueens });
        setIsPaused(true);
        setStatusMessage("Finishing solve without delays...");
        setTimeout(() => handleSolve(false), 10);
        return;
      }

      // If it's a true stop (not finish), check if we should save state
      if (isPaused || solveState) {
        // This was a pause request, save state
        setSolveState({ attempts, currentQueens });
        setIsPaused(true);
        setStatusMessage("Solving paused. Choose an option to continue.");
      } else {
        // This was a stop request, don't save state
        shouldStopRef.current = false;
        setStatusMessage("Solving stopped. Current state preserved.");
      }
    } else {
      setQueens([]);
      updateSafetyMap([]);
      setStatusMessage("Could not find solution within attempt limit.");
    }
  };

  const handleContinue = () => {
    if (isSolving) {
      // If currently solving, pause it
      shouldStopRef.current = true;
    } else if (solveState || isPaused) {
      // If paused, resume with delays
      handleSolve(true);
    }
  };

  const handleFinish = () => {
    if (isSolving) {
      // If currently solving, set flags to stop and then finish without delays
      shouldStopRef.current = true;
      shouldFinishRef.current = true;
      setStatusMessage("Finishing solve without delays...");
    } else if (solveState || isPaused) {
      // If paused, resume without delays
      handleSolve(false);
    }
  };

  const handleStopFinal = () => {
    // First stop the solving process if it's running
    shouldStopRef.current = true;
    shouldFinishRef.current = false;

    // Then clean up the state
    setSolveState(null);
    setIsPaused(false);
    setIsSolving(false);
    setStatusMessage("Solving stopped. Current state preserved.");
  };

  const handleClear = () => {
    if (isToastActive || isSolving) return;
    setQueens([]);
    updateSafetyMap([]);
    setSolveState(null);
    setIsPaused(false);
    setStatusMessage("Board cleared. Place queens or click 'Solve'.");
  };

  const handleSquareClick = (row: number, col: number) => {
    if (isToastActive || isSolving) return;

    // Check if there's already a queen at this position
    const isQueenPresent = queens.some(q => q.row === row && q.col === col);
    const squareName = `${String.fromCharCode(65 + col)}${BOARD_SIZE - row}`;

    // If there's a queen, remove it
    if (isQueenPresent) {
      setStatusMessage(`Queen removed from ${squareName}.`);
      const newQueens = queens.filter(q => !(q.row === row && q.col === col));
      setQueens(newQueens);
      updateSafetyMap(newQueens);
      return;
    }
    
    // If the square is not safe and doesn't have a queen, show error feedback
    if (!safetyMap[row][col]) {
      setStatusMessage(`Cannot place queen at ${squareName} - position is under attack.`);
      setHighlightedSquare({row, col});
      
      // Reset the highlight after 2 seconds
      setTimeout(() => {
        setHighlightedSquare(null);
      }, 2000);
      
      return;
    }
    
    // If we get here, it's safe to place a queen
    setStatusMessage(`Queen placed at ${squareName}.`);
    const newQueens = [...queens, { row, col }];
    setQueens(newQueens);
    updateSafetyMap(newQueens);
  };
  
  // Helper function to calculate safety map without updating state
  const calculateSafetyMap = (queensPositions: QueenPosition[]): boolean[][] => {
    // Create a fresh safety map with all squares marked as safe
    const newSafetyMap = Array(BOARD_SIZE).fill(0).map(() => Array(BOARD_SIZE).fill(true));

    // Mark squares as unsafe based on queen positions
    queensPositions.forEach(queen => {
      const { row, col } = queen;

      // Mark row, column and diagonals as unsafe
      for (let i = 0; i < BOARD_SIZE; i++) {
        // Mark row and column
        newSafetyMap[row][i] = false;
        newSafetyMap[i][col] = false;

        // Mark diagonals
        if (row + i < BOARD_SIZE && col + i < BOARD_SIZE) newSafetyMap[row + i][col + i] = false;
        if (row - i >= 0 && col - i >= 0) newSafetyMap[row - i][col - i] = false;
        if (row + i < BOARD_SIZE && col - i >= 0) newSafetyMap[row + i][col - i] = false;
        if (row - i >= 0 && col + i < BOARD_SIZE) newSafetyMap[row - i][col + i] = false;
      }

      // Queen's position is safe (for display purposes)
      newSafetyMap[row][col] = true;
    });

    return newSafetyMap;
  };

  // Helper function to update safety map state
  const updateSafetyMap = (queensPositions: QueenPosition[]) => {
    const newSafetyMap = calculateSafetyMap(queensPositions);
    setSafetyMap(newSafetyMap);
  };

  // Helper function to find the next valid queen position
  const findNextQueenPosition = (currentQueens: QueenPosition[]): QueenPosition | null => {
    const currentSafetyMap = calculateSafetyMap(currentQueens);

    // Find the next safe position
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (currentQueens.some(q => q.row === row)) continue;
      for (let col = 0; col < BOARD_SIZE; col++) {
        // Skip if there's already a queen in this row or column
        if (currentQueens.some(q => q.col === col)) continue;

        // Check if this position is safe
        if (currentSafetyMap[row][col]) {
          return { row, col };
        }
      }
      break; // If we reach here, no safe position found in a row - no solution with existing queens
    }
    return null;
  };

  // Helper function to backtrack queens when no valid position is found
  const backtrackQueens = (currentQueens: QueenPosition[]): QueenPosition[] => {
    if (currentQueens.length === 0) return [];

    let newQueens = [...currentQueens];
    let newHighestRowQueen = null;

    for (; newHighestRowQueen === null && newQueens.length > 0; ) {
      // find queen in highest row
      const highestRowQueen = newQueens.reduce((acc, queen) => {
        return queen.row > acc.row ? queen : acc;
      }, newQueens[0]);

      // remove the highest row queen
      newQueens = newQueens.filter(q => !(q.row === highestRowQueen.row && q.col === highestRowQueen.col));

      // Calculate the current safety map for immediate use
      const currentSafetyMap = calculateSafetyMap(newQueens);

      // move this queen forward to the next safe position, if possible
      for (let col = highestRowQueen.col + 1; col < BOARD_SIZE; col++) {
        if (currentSafetyMap[highestRowQueen.row][col]) {
          newHighestRowQueen = { row: highestRowQueen.row, col };
          break;
        }
      }
    }

    if (newHighestRowQueen) {
      newQueens.push(newHighestRowQueen);
    }

    return newQueens;
  };

  // Common function to place or move the next queen
  const placeOrMoveNextQueen = (currentQueens: QueenPosition[]): {
    message: string,
    success: boolean,
    newQueens: QueenPosition[]
  } => {
    // Try to place the next queen
    const nextQueen = findNextQueenPosition(currentQueens);

    if (nextQueen) {
      const newQueens = [...currentQueens, nextQueen];
      const squareName = `${String.fromCharCode(65 + nextQueen.col)}${BOARD_SIZE - nextQueen.row}`;
      setQueens(newQueens);
      updateSafetyMap(newQueens);
      return {
        message: `Queen placed at ${squareName}.`,
        success: true,
        newQueens
      };
    }

    // No valid position found, need to backtrack
    const backtrackResult = backtrackQueens(currentQueens);
    if (backtrackResult.length === 0) {
      setQueens([]);
      updateSafetyMap([]);
      return {
        message: "No solution found.",
        success: false,
        newQueens: []
      };
    }

    setQueens(backtrackResult);
    updateSafetyMap(backtrackResult);
    return {
      message: `Backtracking... ${backtrackResult.length} queens remaining.`,
      success: true,
      newQueens: backtrackResult
    };
  };

  // Add a function to place the next queen in a safe position
  const handleSolveNext = () => {
    if (!isClient || isToastActive || isSolving || isPaused) return;

    const result = placeOrMoveNextQueen(queens);
    setStatusMessage(result.message);
  }

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
              safetyMap={safetyMap}
              highlightedSquare={highlightedSquare}
              onSquareClick={handleSquareClick}
              disabled={isToastActive || isSolving}
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
          {isSolving || isPaused ? (
            <>
              <Button
                onClick={handleContinue}
                disabled={isToastActive}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isSolving ? (
                  <>
                    <Square className="mr-2 h-5 w-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" /> Continue
                  </>
                )}
              </Button>
              <Button
                onClick={handleFinish}
                disabled={isToastActive}
                variant="outline"
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              >
                <FastForward className="mr-2 h-5 w-5" /> Finish
              </Button>
              <Button
                onClick={handleStopFinal}
                disabled={isToastActive}
                variant="secondary"
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              >
                <Square className="mr-2 h-5 w-5" /> Stop
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => handleSolve(true)}
                disabled={isToastActive}
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Sparkles className="mr-2 h-5 w-5" /> Solve Puzzle
              </Button>
              <Button
                onClick={handleSolveNext}
                disabled={isToastActive}
                variant="outline"
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronRight className="mr-2 h-5 w-5" /> Solve Next
              </Button>
              <Button
                onClick={handleClear}
                disabled={isToastActive}
                variant="secondary"
                className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow"
              >
                <Trash2 className="mr-2 h-5 w-5" /> Clear Board
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Interactively explore the N-Queens problem. Place queens by clicking on squares.</p>
        <p>Use controls to solve or clear the board. Chessboard is {BOARD_SIZE}x{BOARD_SIZE}.</p>
      </footer>
    </div>
  );
}
