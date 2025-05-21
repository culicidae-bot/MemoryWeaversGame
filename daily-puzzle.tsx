import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { GameLevel } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { playSoundEffect } from "@/lib/audio";

export default function DailyPuzzle() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [dailyPuzzle, setDailyPuzzle] = useState<GameLevel | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDailyPuzzle = async () => {
      try {
        const response = await apiRequest("GET", "/api/daily-puzzle");
        const data = await response.json();
        setDailyPuzzle(data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load daily puzzle. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDailyPuzzle();
  }, [toast]);

  const formatDate = () => {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handlePlayDailyPuzzle = () => {
    if (dailyPuzzle) {
      playSoundEffect("select");
      navigate(`/game/${dailyPuzzle.id}`);
    }
  };

  return (
    <div className="min-h-screen pt-6 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-white"
          onClick={() => navigate("/")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white letter-highlight mb-2">
            <span className="text-accent">D</span>aily{" "}
            <span className="text-secondary">P</span>uzzle
          </h1>
          <p className="text-white/80">{formatDate()}</p>
        </div>

        {loading ? (
          <div className="bg-card/50 rounded-xl p-6 text-center">
            <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-32 mx-auto mb-6" />
            <Skeleton className="h-12 w-40 mx-auto rounded-full" />
          </div>
        ) : (
          <div className="bg-card/50 rounded-xl p-6 text-center animate-float">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-1">
              {dailyPuzzle?.name || "Daily Challenge"}
            </h2>
            <p className="text-white/70 mb-6">
              Complete today's unique puzzle to earn bonus coins!
            </p>
            
            <Button
              className="bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-6 rounded-full magic-btn"
              onClick={handlePlayDailyPuzzle}
            >
              <span className="font-cinzel text-xl">Play Now</span>
            </Button>
            
            <div className="mt-8 text-white/60 text-sm">
              <p>New puzzle available every day at midnight</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
