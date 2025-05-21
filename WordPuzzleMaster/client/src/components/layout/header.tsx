import { Button } from "@/components/ui/button";
import { Settings, Trophy, UserPlus } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { useToast } from "@/hooks/use-toast";
import { playSoundEffect } from "@/lib/audio";

interface HeaderProps {
  onOpenSettings: () => void;
  onOpenLeaderboard: () => void;
}

export function Header({ onOpenSettings, onOpenLeaderboard }: HeaderProps) {
  const { gameState } = useGame();
  const { toast } = useToast();
  
  const handleInviteFriend = () => {
    // Copy invite link
    const inviteLink = window.location.origin;
    navigator.clipboard.writeText(inviteLink);
    
    playSoundEffect("success");
    toast({
      title: "Invite Link Copied!",
      description: "Share this link with friends to invite them to play."
    });
  };

  return (
    <header className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full bg-card/50 hover:bg-card/70"
          onClick={onOpenSettings}
        >
          <Settings className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center">
          <span className="font-bold text-lg">{gameState.user?.coins || 0}</span>
          <span className="ml-1 text-yellow-300">🪙</span>
        </div>
      </div>
      
      <h1 className="font-cinzel text-2xl md:text-3xl font-bold text-center text-white letter-highlight">
        <span className="text-accent">W</span>ORD<span className="text-secondary">S</span>CAPES
      </h1>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full bg-card/50 hover:bg-card/70"
          onClick={onOpenLeaderboard}
        >
          <Trophy className="h-5 w-5" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-10 h-10 rounded-full bg-card/50 hover:bg-card/70"
          onClick={handleInviteFriend}
        >
          <UserPlus className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
