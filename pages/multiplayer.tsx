import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGame } from "@/hooks/use-game";
import { useMultiplayer } from "@/hooks/use-multiplayer";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Crown, PlusCircle, LogIn, ArrowLeft } from "lucide-react";
import { playSoundEffect } from "@/lib/audio";
import { GameLevel } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

type GameRoom = {
  code: string;
  name: string;
  host: string;
  players: string[];
  level: GameLevel;
  status: "waiting" | "playing" | "completed";
};

type ViewState = "lobby" | "create" | "join" | "waiting" | "game";

export default function Multiplayer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { gameState } = useGame();
  const { createRoom, joinRoom, isConnected, roomCode } = useMultiplayer();
  
  const [view, setView] = useState<ViewState>("lobby");
  const [username, setUsername] = useState(gameState.user?.username || "Guest_" + Math.floor(Math.random() * 1000));
  const [roomName, setRoomName] = useState("");
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [levels, setLevels] = useState<GameLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<number>(1);
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch available levels
  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const response = await fetch("/api/levels");
        const data = await response.json();
        setLevels(data);
      } catch (error) {
        console.error("Error fetching levels:", error);
        toast({
          title: "Error",
          description: "Failed to load game levels",
          variant: "destructive",
        });
      }
    };
    
    fetchLevels();
  }, [toast]);
  
  // Auto-join room if connected
  useEffect(() => {
    if (isConnected && roomCode) {
      setView("waiting");
      // In a real implementation, we would fetch room details
      setCurrentRoom({
        code: roomCode,
        name: "Magical Room",
        host: username,
        players: [username],
        level: levels[0] || {
          id: 1,
          name: "Forest Park", 
          gridSize: { rows: 5, cols: 5 },
          grid: [],
          words: [],
          availableLetters: []
        },
        status: "waiting"
      });
    }
  }, [isConnected, roomCode, username, levels]);
  
  const handleCreateRoom = async () => {
    if (!roomName) {
      toast({
        title: "Missing Information",
        description: "Please enter a room name",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const code = await createRoom({
        name: roomName,
        hostName: username,
        maxPlayers: parseInt(maxPlayers),
      });
      
      playSoundEffect("success");
      toast({
        title: "Room Created!",
        description: `Share this code with friends: ${code}`,
      });
      
      setView("waiting");
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error",
        description: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleJoinRoom = async () => {
    if (!joinRoomCode) {
      toast({
        title: "Missing Information",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      await joinRoom({
        code: joinRoomCode,
        playerName: username,
      });
      
      playSoundEffect("success");
      toast({
        title: "Room Joined!",
        description: "Waiting for the host to start the game",
      });
      
      setView("waiting");
    } catch (error) {
      console.error("Error joining room:", error);
      toast({
        title: "Error",
        description: "Failed to join room",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartGame = () => {
    // In a real implementation, we would start the game via WebSocket
    playSoundEffect("success");
    setView("game");
    toast({
      title: "Game Started!",
      description: "Everyone is now playing",
    });
  };
  
  const handleLeaveRoom = () => {
    // In a real implementation, we would leave the room via WebSocket
    setCurrentRoom(null);
    setView("lobby");
    playSoundEffect("select");
    toast({
      title: "Left Room",
      description: "You have left the multiplayer room",
    });
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header with logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white" style={{textShadow: "0 0 10px rgba(255, 255, 255, 0.8)"}}>
            <span style={{color: "hsl(190, 100%, 50%)"}}>M</span>ystic{" "}
            <span style={{color: "hsl(270, 60%, 40%)"}}>W</span>ord{" "}
            <span style={{color: "hsl(210, 100%, 60%)"}}>R</span>ealms
          </h1>
          <div className="flex items-center justify-center">
            <Users className="mr-2 h-5 w-5 text-accent" />
            <p className="text-xl text-white/80">Multiplayer Mode</p>
          </div>
        </div>
        
        {/* Back button (not shown in lobby) */}
        {view !== "lobby" && (
          <Button
            variant="ghost"
            className="mb-4 text-white/80 hover:text-white"
            onClick={() => {
              if (view === "waiting" || view === "game") {
                handleLeaveRoom();
              } else {
                setView("lobby");
              }
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        
        {/* Main content area */}
        <Card className="bg-card/80 border-accent/30 backdrop-blur-sm shadow-xl mb-6">
          <CardContent className="p-6">
            {/* Lobby View */}
            {view === "lobby" && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Multiplayer</h2>
                  <p className="text-muted-foreground mb-6">
                    Play word puzzles with friends in real-time!
                  </p>
                </div>
                
                <div className="mb-4">
                  <Label htmlFor="username" className="mb-2 block">Your Display Name</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-background/50"
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    className="bg-primary hover:bg-primary/80 text-white py-6 flex items-center justify-center"
                    onClick={() => setView("create")}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Room
                  </Button>
                  
                  <Button
                    className="bg-accent hover:bg-accent/80 text-accent-foreground py-6 flex items-center justify-center"
                    onClick={() => setView("join")}
                  >
                    <LogIn className="mr-2 h-5 w-5" />
                    Join Room
                  </Button>
                </div>
              </div>
            )}
            
            {/* Create Room View */}
            {view === "create" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Create New Room</h2>
                
                <div>
                  <Label htmlFor="room-name" className="mb-2 block">Room Name</Label>
                  <Input
                    id="room-name"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="bg-background/50"
                    placeholder="My Magical Room"
                  />
                </div>
                
                <div>
                  <Label htmlFor="max-players" className="mb-2 block">Max Players</Label>
                  <Select 
                    value={maxPlayers} 
                    onValueChange={setMaxPlayers}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select max players" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Players</SelectItem>
                      <SelectItem value="3">3 Players</SelectItem>
                      <SelectItem value="4">4 Players</SelectItem>
                      <SelectItem value="5">5 Players</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="game-level" className="mb-2 block">Game Level</Label>
                  <Select 
                    value={selectedLevelId.toString()} 
                    onValueChange={(val) => setSelectedLevelId(parseInt(val))}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select a level" />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  className="w-full bg-primary hover:bg-primary/80 text-white"
                  onClick={handleCreateRoom}
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Room"}
                </Button>
              </div>
            )}
            
            {/* Join Room View */}
            {view === "join" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-4">Join Room</h2>
                
                <div>
                  <Label htmlFor="room-code" className="mb-2 block">Room Code</Label>
                  <Input
                    id="room-code"
                    value={joinRoomCode}
                    onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                    className="bg-background/50"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
                
                <Button
                  className="w-full bg-accent hover:bg-accent/80 text-accent-foreground"
                  onClick={handleJoinRoom}
                  disabled={loading}
                >
                  {loading ? "Joining..." : "Join Room"}
                </Button>
              </div>
            )}
            
            {/* Waiting Room View */}
            {view === "waiting" && currentRoom && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-2">{currentRoom.name}</h2>
                  <div className="bg-primary/20 rounded-md py-2 px-4 mb-4">
                    <p className="text-center font-mono font-bold text-xl">{currentRoom.code}</p>
                    <p className="text-sm text-center text-muted-foreground">Share this code with friends</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Players</h3>
                  <div className="space-y-2">
                    {currentRoom.players.map((player, index) => (
                      <div key={index} className="flex items-center bg-background/30 p-2 rounded-md">
                        {index === 0 && <Crown className="h-4 w-4 mr-2 text-yellow-400" />}
                        <span>{player}</span>
                        {index === 0 && <span className="ml-auto text-xs text-muted-foreground">(Host)</span>}
                      </div>
                    ))}
                    {Array.from({ length: parseInt(maxPlayers) - currentRoom.players.length }).map((_, index) => (
                      <div key={`empty-${index}`} className="flex items-center bg-background/10 p-2 rounded-md text-muted-foreground">
                        <span>Waiting for player...</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Level</h3>
                  <div className="bg-background/30 p-3 rounded-md flex items-center">
                    <div>
                      <p className="font-medium">{currentRoom.level.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentRoom.level.words.length} words to find
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Only host can start the game */}
                {currentRoom.players[0] === username && (
                  <Button
                    className="w-full bg-primary hover:bg-primary/80 text-white"
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                )}
              </div>
            )}
            
            {/* Game View - Placeholder for actual gameplay */}
            {view === "game" && (
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Game in Progress</h2>
                <p className="mb-4">
                  This is where the multiplayer game interface would be rendered!
                </p>
                <p className="text-muted-foreground mb-6">
                  Players would see the same puzzle and compete to find words.
                </p>
                
                <Button
                  className="bg-destructive hover:bg-destructive/80 text-white"
                  onClick={handleLeaveRoom}
                >
                  Leave Game
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer element */}
        <footer className="text-center text-muted-foreground text-sm">
          <p>Mystic Word Realms - Multiplayer Edition</p>
        </footer>
      </div>
    </div>
  );
}