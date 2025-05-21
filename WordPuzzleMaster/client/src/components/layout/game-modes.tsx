import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { playSoundEffect } from "@/lib/audio";

export function GameModes() {
  const [, navigate] = useLocation();
  
  const handleGoToLevelSelect = () => {
    playSoundEffect("select");
    navigate("/levels");
  };
  
  const handleOpenDailyPuzzle = () => {
    playSoundEffect("select");
    navigate("/daily");
  };
  
  return (
    <div className="flex justify-center gap-4 mb-6 px-4">
      <Button
        className="bg-primary hover:bg-primary/80 text-white font-medium py-2 px-6 rounded-full transition-all magic-btn"
        onClick={handleGoToLevelSelect}
      >
        <span className="font-cinzel">LEVELS</span>
      </Button>
      
      <Button
        className="bg-yellow-600 hover:bg-yellow-500 text-white font-medium py-2 px-6 rounded-full transition-all magic-btn"
        onClick={handleOpenDailyPuzzle}
      >
        <span className="font-cinzel">DAILY PUZZLE</span>
      </Button>
    </div>
  );
}
