import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// Temporarily remove the useGame hook for initial setup
// import { useGame } from "@/hooks/use-game";
import { playBackgroundMusic } from "@/lib/audio";
import { RegisterModal } from "@/components/modals/register-modal";

export default function Home() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  // Create local state for initial development
  const [guestUser] = useState({
    username: "Guest_" + Math.floor(Math.random() * 10000),
    coins: 500,
    settings: {
      musicEnabled: true,
      sfxEnabled: true,
    }
  });

  useEffect(() => {
    // Start background music 
    playBackgroundMusic();
  }, []);

  const handleStartGame = () => {
    navigate("/levels");
  };

  const handleOpenDailyPuzzle = () => {
    navigate("/daily");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10" style={{animation: "float 3s ease-in-out infinite"}}>
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-white" style={{textShadow: "0 0 10px rgba(255, 255, 255, 0.8)"}}>
          <span style={{color: "hsl(190, 100%, 50%)"}}>M</span>ystic{" "}
          <span style={{color: "hsl(270, 60%, 40%)"}}>W</span>ord{" "}
          <span style={{color: "hsl(210, 100%, 60%)"}}>R</span>ealms
        </h1>
        <p className="text-xl text-white/80 max-w-md mx-auto">
          Challenge your friends in real-time multiplayer word battles!
        </p>
        <div className="mt-6 mx-auto max-w-md rounded-xl bg-slate-800/50 p-4 border border-accent/20">
          <h2 className="text-lg font-bold text-white mb-2">🏆 Multiplayer Features 🏆</h2>
          <ul className="text-left text-sm space-y-2 text-white/90">
            <li>• Create rooms and invite friends with a unique code</li>
            <li>• Compete in real-time to solve word puzzles</li>
            <li>• Track scores on global and personal leaderboards</li>
            <li>• Chat with other players during gameplay</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button
          size="lg"
          style={{
            backgroundColor: "hsl(210, 100%, 60%)",
            color: "white",
            fontWeight: "bold",
            padding: "1rem",
            borderRadius: "9999px",
            boxShadow: "0 0 10px rgba(76, 201, 240, 0.3), 0 0 20px rgba(76, 201, 240, 0.2)",
            transition: "all 0.2s"
          }}
          onClick={() => navigate("/multiplayer")}
        >
          <span style={{fontFamily: "'Cinzel', serif", fontSize: "1.25rem"}}>Play Multiplayer</span>
        </Button>
        
        <Button
          variant="outline"
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "2px solid hsl(190, 100%, 50%)",
            fontWeight: "bold",
            padding: "1rem",
            borderRadius: "9999px",
            transition: "all 0.2s"
          }}
          onClick={() => setShowRegisterModal(true)}
        >
          <span style={{fontFamily: "'Cinzel', serif", fontSize: "1.25rem"}}>Create Account</span>
        </Button>
      </div>

      <div className="mt-12 max-w-md text-center">
        <h3 className="text-white font-semibold mb-2">How To Play</h3>
        <p className="text-white/70 text-sm">
          Form words from the circle of letters and compete with friends to see who can solve the puzzle faster. Create a room and share the code with friends to start playing together!
        </p>
      </div>

      <div className="mt-16 text-white/60 text-sm">
        <p>©2023 Mystic Word Realms - Multiplayer Edition</p>
      </div>
      
      <RegisterModal 
        open={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
        onSuccess={() => {
          setShowRegisterModal(false);
          toast({
            title: "Account created!",
            description: "You can now save your progress and compete on leaderboards."
          });
          
          // Redirect to multiplayer page after registration
          setTimeout(() => navigate("/multiplayer"), 1500);
        }}
      />
    </div>
  );
}
