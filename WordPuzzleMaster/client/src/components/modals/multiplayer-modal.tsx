import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, PlusCircle, LogIn } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { useMultiplayer } from "@/hooks/use-multiplayer";
import { useToast } from "@/hooks/use-toast";
import { playSoundEffect } from "@/lib/audio";

interface MultiplayerModalProps {
  open: boolean;
  onClose: () => void;
}

type ModalView = "main" | "create" | "join";

export function MultiplayerModal({ open, onClose }: MultiplayerModalProps) {
  const { gameState } = useGame();
  const { createRoom, joinRoom } = useMultiplayer();
  const { toast } = useToast();
  
  const [view, setView] = useState<ModalView>("main");
  const [roomName, setRoomName] = useState("");
  const [displayName, setDisplayName] = useState(gameState.user?.username || "");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  
  const handleCreateRoom = async () => {
    if (!roomName || !displayName) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const code = await createRoom({
        name: roomName,
        hostName: displayName,
        maxPlayers: parseInt(maxPlayers)
      });
      
      playSoundEffect("success");
      toast({
        title: "Room Created!",
        description: `Share this code with friends: ${code}`,
      });
      
      setView("main");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleJoinRoom = async () => {
    if (!roomCode || !displayName) {
      toast({
        title: "Missing Information",
        description: "Please fill out all fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await joinRoom({
        code: roomCode,
        playerName: displayName
      });
      
      playSoundEffect("success");
      toast({
        title: "Joined Room!",
        description: "You've successfully joined the room.",
      });
      
      setView("main");
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join room. Please check the code and try again.",
        variant: "destructive",
      });
    }
  };
  
  const resetAndClose = () => {
    setView("main");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && resetAndClose()}>
      <DialogContent className="bg-card/90 border-accent/30 p-6 m-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-cinzel text-2xl text-white">Multiplayer Mode</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={resetAndClose}
            className="text-muted-foreground hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {view === "main" && (
          <div className="space-y-6">
            <div className="flex gap-4 justify-center">
              <Button
                className="flex-1 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-lg transition-all magic-btn"
                onClick={() => setView("create")}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Create Room
              </Button>
              
              <Button
                className="flex-1 bg-accent hover:bg-accent/80 text-accent-foreground font-medium py-3 px-4 rounded-lg transition-all magic-btn"
                onClick={() => setView("join")}
              >
                <LogIn className="mr-2 h-5 w-5" />
                Join Room
              </Button>
            </div>
          </div>
        )}
        
        {view === "join" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="room-code" className="block text-sm font-medium mb-1">Room Code</Label>
              <Input
                id="room-code"
                className="bg-background/50 border-accent/40"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
              />
            </div>
            
            <div>
              <Label htmlFor="display-name-join" className="block text-sm font-medium mb-1">Your Display Name</Label>
              <Input
                id="display-name-join"
                className="bg-background/50 border-accent/40"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            
            <Button
              className="w-full bg-accent hover:bg-accent/80 text-accent-foreground font-medium py-2 px-4 rounded-lg transition-all magic-btn"
              onClick={handleJoinRoom}
            >
              Join Game
            </Button>
            
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setView("main")}
            >
              Back
            </Button>
          </div>
        )}
        
        {view === "create" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="room-name" className="block text-sm font-medium mb-1">Room Name</Label>
              <Input
                id="room-name"
                className="bg-background/50 border-accent/40"
                placeholder="My Magical Room"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="display-name-create" className="block text-sm font-medium mb-1">Your Display Name</Label>
              <Input
                id="display-name-create"
                className="bg-background/50 border-accent/40"
                placeholder="Enter your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="max-players" className="block text-sm font-medium mb-1">Max Players</Label>
              <Select 
                value={maxPlayers} 
                onValueChange={setMaxPlayers}
              >
                <SelectTrigger className="bg-background/50 border-accent/40">
                  <SelectValue placeholder="Select max players" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Players</SelectItem>
                  <SelectItem value="3">3 Players</SelectItem>
                  <SelectItem value="4">4 Players</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              className="w-full bg-primary hover:bg-primary/80 text-white font-medium py-2 px-4 rounded-lg transition-all magic-btn"
              onClick={handleCreateRoom}
            >
              Create Room
            </Button>
            
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setView("main")}
            >
              Back
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
