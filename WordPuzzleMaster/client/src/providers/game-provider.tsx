import { createContext, useState, ReactNode, useCallback } from "react";
import { GameLevel, User } from "@shared/schema";

interface GameState {
  user: User | null;
  currentLevel: GameLevel | null;
  foundWords: string[];
  hintsUsed: number;
}

interface GameContextType {
  gameState: GameState;
  initializeUser: (user: User) => void;
  updateSettings: (settings: User["settings"]) => void;
  updateFoundWords: (word: string) => void;
  addCoins: (amount: number) => void;
  completeLevel: (levelId: number, stats: { 
    timeSpent: number;
    hintsUsed: number;
    foundWords: string[];
  }) => void;
}

export const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    user: null,
    currentLevel: null,
    foundWords: [],
    hintsUsed: 0
  });
  
  const initializeUser = useCallback((user: User) => {
    setGameState(prev => ({ ...prev, user }));
  }, []);
  
  const updateSettings = useCallback((settings: User["settings"]) => {
    setGameState(prev => {
      if (!prev.user) return prev;
      
      return {
        ...prev,
        user: {
          ...prev.user,
          settings
        }
      };
    });
  }, []);
  
  const updateFoundWords = useCallback((word: string) => {
    setGameState(prev => ({
      ...prev,
      foundWords: [...prev.foundWords, word]
    }));
  }, []);
  
  const addCoins = useCallback((amount: number) => {
    setGameState(prev => {
      if (!prev.user) return prev;
      
      return {
        ...prev,
        user: {
          ...prev.user,
          coins: prev.user.coins + amount
        }
      };
    });
  }, []);
  
  const completeLevel = useCallback((levelId: number, stats: { 
    timeSpent: number;
    hintsUsed: number;
    foundWords: string[];
  }) => {
    setGameState(prev => {
      if (!prev.user) return prev;
      
      // Update current level if user just completed their current level
      const newCurrentLevel = 
        levelId === prev.user.currentLevel 
          ? levelId + 1 
          : prev.user.currentLevel;
      
      return {
        ...prev,
        user: {
          ...prev.user,
          currentLevel: newCurrentLevel
        },
        hintsUsed: stats.hintsUsed,
        foundWords: stats.foundWords
      };
    });
  }, []);
  
  return (
    <GameContext.Provider
      value={{
        gameState,
        initializeUser,
        updateSettings,
        updateFoundWords,
        addCoins,
        completeLevel
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
