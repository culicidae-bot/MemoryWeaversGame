import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { GameLevel } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import { Header } from "@/components/layout/header";
import { GameModes } from "@/components/layout/game-modes";
import { CrosswordGrid } from "@/components/game/crossword-grid";
import { FoundWords } from "@/components/game/found-words";
import { LetterCircle } from "@/components/game/letter-circle";
import { LevelComplete } from "@/components/game/level-complete";
import { SettingsModal } from "@/components/modals/settings-modal";
import { LeaderboardModal } from "@/components/modals/leaderboard-modal";
import { MultiplayerModal } from "@/components/modals/multiplayer-modal";
import { isWordValid } from "@/lib/dictionary";
import { playSoundEffect } from "@/lib/audio";

export default function Game() {
  const [, params] = useRoute<{ levelId: string }>("/game/:levelId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { gameState, updateFoundWords, completeLevel } = useGame();
  
  const [level, setLevel] = useState<GameLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  useEffect(() => {
    const levelId = params?.levelId;
    
    if (!levelId) {
      navigate("/levels");
      return;
    }
    
    const fetchLevel = async () => {
      try {
        // For daily puzzle
        const endpoint = levelId === "999" 
          ? "/api/daily-puzzle" 
          : `/api/levels/${levelId}`;
          
        const response = await fetch(endpoint);
        const data = await response.json();
        setLevel(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load level. Please try again.",
          variant: "destructive",
        });
        navigate("/levels");
      } finally {
        setLoading(false);
      }
    };

    fetchLevel();
    
    // Start timer
    const timer = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [params, navigate, toast]);
  
  const handleWordFound = (word: string) => {
    // Check if word is in the level's list of words
    if (level && level.words.some(w => w.text === word) && !foundWords.includes(word)) {
      playSoundEffect("correct");
      setFoundWords(prev => [...prev, word]);
      
      // Update the grid to show the found word
      updateFoundWords(word);
      
      // Check if all words are found
      if (foundWords.length + 1 === level.words.length) {
        setIsLevelComplete(true);
        completeLevel(level.id, {
          timeSpent,
          hintsUsed,
          foundWords: [...foundWords, word]
        });
      }
    } else if (!isWordValid(word)) {
      playSoundEffect("error");
      toast({
        title: "Invalid Word",
        description: "That's not a valid English word!"
      });
    } else if (foundWords.includes(word)) {
      playSoundEffect("error");
      toast({
        title: "Already Found",
        description: "You've already found that word!"
      });
    }
  };
  
  const handleUseHint = () => {
    if (!level) return;
    
    // Find a word that hasn't been found yet
    const remainingWords = level.words
      .map(w => w.text)
      .filter(word => !foundWords.includes(word));
    
    if (remainingWords.length > 0) {
      const randomWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
      const firstLetter = randomWord[0];
      
      setHintsUsed(prev => prev + 1);
      playSoundEffect("hint");
      
      toast({
        title: "Hint Used",
        description: `Try a word that starts with "${firstLetter}"`
      });
    }
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Loading level...</div>
    </div>;
  }
  
  if (!level) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-white text-xl">Level not found</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />
      
      <div className="text-center mb-4 flex justify-center items-center gap-3 px-4">
        <div className="bg-card/50 backdrop-blur-sm rounded-full px-4 py-1 inline-flex items-center">
          <span className="font-bold">LEVEL</span>
          <span className="bg-accent ml-2 w-10 h-10 rounded-full flex items-center justify-center text-accent-foreground font-bold">
            {level.id}
          </span>
        </div>
        
        <div className="bg-yellow-500 bg-opacity-90 rounded-full px-4 py-1 inline-flex items-center">
          <span className="font-bold text-dark">{gameState.user?.coins || 0}</span>
          <span className="ml-1 text-dark">🪙</span>
        </div>
      </div>
      
      <main className="flex-1 flex flex-col items-center justify-between max-w-2xl mx-auto w-full px-4 pb-6">
        <CrosswordGrid 
          grid={level.grid} 
          size={level.gridSize} 
          foundWords={foundWords}
        />
        
        <FoundWords words={foundWords} />
        
        <LetterCircle 
          letters={level.availableLetters} 
          onWordFormed={handleWordFound}
          onShuffle={() => playSoundEffect("shuffle")}
          onUseHint={handleUseHint}
          onToggleMultiplayer={() => setShowMultiplayer(true)}
        />
      </main>
      
      <GameModes />
      
      {/* Modals */}
      <SettingsModal 
        open={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
      
      <LeaderboardModal 
        open={showLeaderboard} 
        onClose={() => setShowLeaderboard(false)} 
      />
      
      <MultiplayerModal 
        open={showMultiplayer} 
        onClose={() => setShowMultiplayer(false)} 
      />
      
      <LevelComplete 
        open={isLevelComplete}
        levelId={level.id}
        wordsFound={foundWords.length}
        totalWords={level.words.length}
        timeSpent={timeSpent}
        hintsUsed={hintsUsed}
        onReplay={() => {
          setIsLevelComplete(false);
          setFoundWords([]);
          setTimeSpent(0);
          setHintsUsed(0);
        }}
        onNextLevel={() => {
          navigate(`/game/${level.id + 1}`);
        }}
      />
    </div>
  );
}
