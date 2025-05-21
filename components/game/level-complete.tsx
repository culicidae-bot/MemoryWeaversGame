import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowRight } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { formatTime } from "@/lib/utils";
import { playSoundEffect } from "@/lib/audio";
import { useEffect } from "react";

interface LevelCompleteProps {
  open: boolean;
  levelId: number;
  wordsFound: number;
  totalWords: number;
  timeSpent: number;
  hintsUsed: number;
  onReplay: () => void;
  onNextLevel: () => void;
}

export function LevelComplete({
  open,
  levelId,
  wordsFound,
  totalWords,
  timeSpent,
  hintsUsed,
  onReplay,
  onNextLevel
}: LevelCompleteProps) {
  const { gameState, addCoins } = useGame();
  
  // Calculate rewards based on performance
  const calculateRewards = () => {
    // Base reward for completing the level
    let reward = 100;
    
    // Bonus for finding all words
    if (wordsFound === totalWords) {
      reward += 50;
    }
    
    // Time bonus - faster is better
    if (timeSpent < 60) { // Under 1 minute
      reward += 100;
    } else if (timeSpent < 120) { // Under 2 minutes
      reward += 50;
    } else if (timeSpent < 180) { // Under 3 minutes
      reward += 25;
    }
    
    // Penalty for using hints
    reward -= hintsUsed * 15;
    
    // Ensure minimum reward
    return Math.max(50, reward);
  };
  
  const coinsEarned = calculateRewards();
  
  useEffect(() => {
    if (open) {
      playSoundEffect("levelComplete");
      // Add coins to user's balance
      addCoins(coinsEarned);
    }
  }, [open, addCoins, coinsEarned]);

  return (
    <Dialog open={open}>
      <DialogContent className="bg-card/90 border-accent/30 p-6 m-4 max-w-lg w-full text-center">
        <div className="animate-float">
          <h2 className="font-cinzel text-3xl text-yellow-300 mb-2">Level Complete!</h2>
          <p className="text-lg mb-6">You've completed Level {levelId}</p>
          
          <div className="bg-background/50 rounded-xl p-5 mb-6">
            <div className="flex justify-between mb-4">
              <span>Words Found:</span>
              <span>{wordsFound}/{totalWords}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Time:</span>
              <span>{formatTime(timeSpent)}</span>
            </div>
            <div className="flex justify-between mb-4">
              <span>Hints Used:</span>
              <span>{hintsUsed}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-yellow-300">
              <span>Coins Earned:</span>
              <span>+{coinsEarned}</span>
            </div>
          </div>
          
          <div className="flex gap-4 justify-center">
            <Button
              variant="outline"
              className="bg-card hover:bg-muted text-white font-medium py-3 px-6 rounded-full transition-all magic-btn"
              onClick={onReplay}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Replay
            </Button>
            
            <Button
              className="bg-primary hover:bg-primary/80 text-white font-medium py-3 px-6 rounded-full transition-all magic-btn"
              onClick={onNextLevel}
            >
              Next Level <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
