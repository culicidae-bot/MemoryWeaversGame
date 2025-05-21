import { useContext } from "react";
import { GameContext } from "@/providers/game-provider";

// Temporary solution to return default values when context isn't available
export function useGame() {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    // Return a mock context during initial development
    return {
      gameState: {
        user: {
          id: 1,
          username: "Guest_" + Math.floor(Math.random() * 10000),
          coins: 500,
          currentLevel: 1,
          hintsRemaining: 3,
          settings: {
            musicEnabled: true,
            sfxEnabled: true,
            theme: "magical",
            difficulty: "beginner",
          },
        },
        currentLevel: null,
        foundWords: [],
        hintsUsed: 0
      },
      initializeUser: () => {},
      updateSettings: () => {},
      updateFoundWords: () => {},
      addCoins: () => {},
      completeLevel: () => {}
    };
  }
  
  return context;
}
