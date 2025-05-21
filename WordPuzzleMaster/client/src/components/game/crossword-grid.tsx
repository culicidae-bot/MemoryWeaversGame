import { useEffect, useState } from "react";
import { GridPosition } from "@shared/schema";

interface CrosswordGridProps {
  grid: GridPosition[][];
  size: { rows: number; cols: number };
  foundWords: string[];
}

export function CrosswordGrid({ grid, size, foundWords }: CrosswordGridProps) {
  const [gridState, setGridState] = useState<GridPosition[][]>([]);
  
  useEffect(() => {
    // Initialize the grid state
    setGridState(grid);
  }, [grid]);
  
  useEffect(() => {
    // Update grid when words are found
    if (foundWords.length > 0) {
      // Create a deep copy of the grid
      const newGrid = JSON.parse(JSON.stringify(grid)) as GridPosition[][];
      
      // Mark cells as filled for found words
      foundWords.forEach(word => {
        const letters = word.split('');
        
        // Find first occurrence of the first letter
        const firstLetter = letters[0];
        for (let row = 0; row < size.rows; row++) {
          for (let col = 0; col < size.cols; col++) {
            if (newGrid[row][col].letter === firstLetter) {
              // Check horizontally
              let horizontal = true;
              for (let i = 0; i < letters.length; i++) {
                if (col + i >= size.cols || newGrid[row][col + i].letter !== letters[i]) {
                  horizontal = false;
                  break;
                }
              }
              
              if (horizontal) {
                for (let i = 0; i < letters.length; i++) {
                  newGrid[row][col + i].filled = true;
                }
                return;
              }
              
              // Check vertically
              let vertical = true;
              for (let i = 0; i < letters.length; i++) {
                if (row + i >= size.rows || newGrid[row + i][col].letter !== letters[i]) {
                  vertical = false;
                  break;
                }
              }
              
              if (vertical) {
                for (let i = 0; i < letters.length; i++) {
                  newGrid[row + i][col].filled = true;
                }
                return;
              }
            }
          }
        }
      });
      
      setGridState(newGrid);
    }
  }, [foundWords, grid, size]);

  return (
    <div className="crossword-grid w-full max-w-md mx-auto rounded-xl p-3 mb-4">
      <div 
        className="grid gap-1"
        style={{ 
          gridTemplateColumns: `repeat(${size.cols}, 1fr)`,
          gridTemplateRows: `repeat(${size.rows}, 1fr)`
        }}
      >
        {gridState.flat().map((cell, index) => {
          const isEmpty = !cell.letter;
          
          return (
            <div 
              key={index}
              className={`w-full aspect-square rounded flex items-center justify-center transition-all duration-300 ${
                isEmpty 
                  ? "bg-transparent border border-accent/20" 
                  : cell.filled
                    ? "bg-secondary/80"
                    : "bg-card/30"
              }`}
            >
              {!isEmpty && cell.filled && (
                <span className="text-xl font-bold">{cell.letter}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
