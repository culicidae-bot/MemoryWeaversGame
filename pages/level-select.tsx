import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, Star, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/hooks/use-game";
import { apiRequest } from "@/lib/queryClient";
import { GameLevel } from "@shared/schema";
import { playSoundEffect } from "@/lib/audio";

export default function LevelSelect() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { gameState } = useGame();
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const userLevel = gameState.user?.currentLevel || 1;

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await apiRequest("/api/levels");
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load levels. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, [toast]);

  const handleLevelSelect = (level: GameLevel) => {
    if (level.id <= userLevel) {
      playSoundEffect("select");
      navigate(`/game/${level.id}`);
    } else {
      playSoundEffect("error");
      toast({
        title: "Level Locked",
        description: "Complete previous levels to unlock this one.",
      });
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-white"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white letter-highlight mb-2">
            <span className="text-accent">S</span>elect{" "}
            <span className="text-secondary">L</span>evel
          </h1>
          <p className="text-white/80">
            Current Progress: Level {userLevel}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="aspect-square bg-card/50 animate-pulse">
                <CardContent className="p-0 h-full"></CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {levels.map((level) => (
              <Card
                key={level.id}
                className={`relative overflow-hidden cursor-pointer transition-transform hover:scale-105 ${
                  level.id <= userLevel
                    ? "bg-card/70"
                    : "bg-card/30 grayscale"
                }`}
                onClick={() => handleLevelSelect(level)}
              >
                <CardContent className="p-0 h-full flex flex-col items-center justify-center py-6">
                  {level.id > userLevel && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Lock className="h-8 w-8 text-white/80" />
                    </div>
                  )}
                  <span className="text-4xl font-bold text-accent mb-2">
                    {level.id}
                  </span>
                  <h3 className="text-lg font-medium text-white mb-4">
                    {level.name}
                  </h3>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < (level.id <= userLevel ? 3 : 0)
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-500"
                        }`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
