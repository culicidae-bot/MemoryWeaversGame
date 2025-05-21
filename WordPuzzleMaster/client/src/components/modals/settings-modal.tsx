import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { playSoundEffect } from "@/lib/audio";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

type Theme = "magical" | "cosmic" | "forest";
type Difficulty = "beginner" | "normal" | "mystic";

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { gameState, updateSettings } = useGame();
  
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<Theme>("magical");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("beginner");
  
  useEffect(() => {
    if (gameState.user) {
      setMusicEnabled(gameState.user.settings.musicEnabled);
      setSfxEnabled(gameState.user.settings.sfxEnabled);
      setSelectedTheme(gameState.user.settings.theme as Theme);
      setSelectedDifficulty(gameState.user.settings.difficulty as Difficulty);
    }
  }, [gameState.user, open]);
  
  const handleSaveSettings = () => {
    if (gameState.user) {
      updateSettings({
        musicEnabled,
        sfxEnabled,
        theme: selectedTheme,
        difficulty: selectedDifficulty
      });
    }
    
    playSoundEffect("success");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card/90 border-accent/30 p-6 m-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-cinzel text-2xl text-white">Settings</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          {/* Audio Settings */}
          <div>
            <h3 className="font-bold mb-3">Audio</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="music">Background Music</Label>
                <Switch
                  id="music"
                  checked={musicEnabled}
                  onCheckedChange={setMusicEnabled}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sfx">Sound Effects</Label>
                <Switch
                  id="sfx"
                  checked={sfxEnabled}
                  onCheckedChange={setSfxEnabled}
                />
              </div>
            </div>
          </div>
          
          {/* Theme Settings */}
          <div>
            <h3 className="font-bold mb-3">Theme</h3>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`cursor-pointer bg-gradient-to-br from-blue-800 to-blue-500 rounded-lg p-2 aspect-video flex items-center justify-center transition-all ${
                  selectedTheme === "magical" ? "border-2 border-accent" : "opacity-70"
                }`}
                onClick={() => setSelectedTheme("magical")}
              >
                <span className="text-sm font-medium">Magical</span>
              </div>
              
              <div 
                className={`cursor-pointer bg-gradient-to-br from-purple-800 to-pink-500 rounded-lg p-2 aspect-video flex items-center justify-center transition-all ${
                  selectedTheme === "cosmic" ? "border-2 border-accent" : "opacity-70"
                }`}
                onClick={() => setSelectedTheme("cosmic")}
              >
                <span className="text-sm font-medium">Cosmic</span>
              </div>
              
              <div 
                className={`cursor-pointer bg-gradient-to-br from-green-800 to-green-500 rounded-lg p-2 aspect-video flex items-center justify-center transition-all ${
                  selectedTheme === "forest" ? "border-2 border-accent" : "opacity-70"
                }`}
                onClick={() => setSelectedTheme("forest")}
              >
                <span className="text-sm font-medium">Forest</span>
              </div>
            </div>
          </div>
          
          {/* Difficulty Settings */}
          <div>
            <h3 className="font-bold mb-3">Difficulty</h3>
            <div className="flex">
              <Button
                className={`flex-1 py-2 rounded-l-lg transition-colors ${
                  selectedDifficulty === "beginner" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setSelectedDifficulty("beginner")}
              >
                Beginner
              </Button>
              
              <Button
                className={`flex-1 py-2 transition-colors ${
                  selectedDifficulty === "normal" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setSelectedDifficulty("normal")}
              >
                Normal
              </Button>
              
              <Button
                className={`flex-1 py-2 rounded-r-lg transition-colors ${
                  selectedDifficulty === "mystic" 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setSelectedDifficulty("mystic")}
              >
                Mystic
              </Button>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button
              className="bg-primary hover:bg-primary/80 text-white font-medium py-2 px-8 rounded-full transition-all magic-btn"
              onClick={handleSaveSettings}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
