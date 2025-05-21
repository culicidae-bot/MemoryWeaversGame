import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LeaderboardEntry } from "@shared/schema";

interface LeaderboardModalProps {
  open: boolean;
  onClose: () => void;
}

type LeaderboardView = "global" | "friends" | "weekly";

export function LeaderboardModal({ open, onClose }: LeaderboardModalProps) {
  const { toast } = useToast();
  const [view, setView] = useState<LeaderboardView>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (open) {
      fetchLeaderboard(view);
    }
  }, [open, view]);
  
  const fetchLeaderboard = async (type: LeaderboardView) => {
    setLoading(true);
    
    try {
      const endpoint = type === "weekly" 
        ? "/api/leaderboard/weekly"
        : "/api/leaderboard";
        
      const response = await apiRequest("GET", endpoint);
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load leaderboard data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card/90 border-accent/30 p-6 m-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-cinzel text-2xl text-white">Leaderboard</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-muted-foreground hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mb-4">
          <div className="flex border-b border-muted">
            <Button
              variant="ghost"
              className={`py-2 px-4 border-b-2 ${
                view === "global" 
                  ? "border-accent text-accent" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setView("global")}
            >
              Global
            </Button>
            
            <Button
              variant="ghost"
              className={`py-2 px-4 border-b-2 ${
                view === "friends" 
                  ? "border-accent text-accent" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setView("friends")}
            >
              Friends
            </Button>
            
            <Button
              variant="ghost"
              className={`py-2 px-4 border-b-2 ${
                view === "weekly" 
                  ? "border-accent text-accent" 
                  : "border-transparent text-muted-foreground"
              }`}
              onClick={() => setView("weekly")}
            >
              Weekly
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No entries found
              </div>
            ) : (
              entries.map((entry, index) => (
                <div key={entry.id} className="flex items-center bg-background/40 rounded-lg p-3">
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                    index === 0 ? "bg-accent text-accent-foreground" :
                    index === 1 ? "bg-gray-500 text-white" :
                    index === 2 ? "bg-yellow-700 text-white" :
                    "border border-gray-600 text-gray-200"
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="ml-3 flex-1">
                    <div className="font-bold">Player #{entry.userId}</div>
                    <div className="text-xs text-muted-foreground">Level {entry.level}</div>
                  </div>
                  
                  <div className="font-bold text-yellow-300 flex items-center">
                    {entry.score}
                    <span className="ml-1">🪙</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        <div className="mt-6 bg-primary/20 rounded-lg p-3 flex items-center">
          <div className="w-8 h-8 flex items-center justify-center bg-primary rounded-full text-white font-bold">
            #
          </div>
          <div className="ml-3 flex-1">
            <div className="font-bold">You (Player)</div>
            <div className="text-xs text-muted-foreground">Level {1}</div>
          </div>
          <div className="font-bold text-yellow-300 flex items-center">
            {500}
            <span className="ml-1">🪙</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
