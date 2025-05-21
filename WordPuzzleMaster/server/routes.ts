import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSockets } from "./websocket";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertLeaderboardEntrySchema, 
  insertUserLevelProgressSchema,
  insertMultiplayerRoomSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Enable WebSockets for multiplayer functionality
  setupWebSockets(httpServer);
  
  // User routes
  app.post("/api/users/register", async (req, res) => {
    try {
      console.log("Registration request received:", req.body);
      const userData = insertUserSchema.parse(req.body);
      console.log("Parsed user data:", userData);
      
      const existingUser = await storage.getUserByUsername(userData.username);
      
      if (existingUser) {
        console.log("Username already taken:", userData.username);
        return res.status(409).json({ message: "Username already taken" });
      }
      
      console.log("Creating new user:", userData.username);
      const user = await storage.createUser(userData);
      console.log("User created successfully:", user);
      
      res.status(201).json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: `Invalid user data: ${error.message}` });
      } else {
        res.status(400).json({ message: "Invalid user data" });
      }
    }
  });
  
  app.post("/api/users/login", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // In a real app, use proper authentication
      res.status(200).json({ 
        id: user.id, 
        username: user.username, 
        coins: user.coins,
        currentLevel: user.currentLevel,
        hintsRemaining: user.hintsRemaining,
        settings: user.settings
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });
  
  app.get("/api/users/:id", async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ 
      id: user.id, 
      username: user.username, 
      coins: user.coins,
      currentLevel: user.currentLevel,
      hintsRemaining: user.hintsRemaining,
      settings: user.settings
    });
  });
  
  app.patch("/api/users/:id/settings", async (req, res) => {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const settingsSchema = z.object({
      musicEnabled: z.boolean().optional(),
      sfxEnabled: z.boolean().optional(),
      theme: z.string().optional(),
      difficulty: z.string().optional()
    });
    
    try {
      const settings = settingsSchema.parse(req.body);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Type-safe way to merge settings
      const currentSettings = user.settings as Record<string, unknown>;
      const newSettings = settings as Record<string, unknown>;
      const updatedSettings = Object.assign({}, currentSettings, newSettings);
      
      const updatedUser = await storage.updateUser(userId, { settings: updatedSettings });
      
      res.status(200).json({ settings: updatedUser?.settings });
    } catch (error) {
      res.status(400).json({ message: "Invalid settings data" });
    }
  });
  
  // Game level routes
  app.get("/api/levels", async (req, res) => {
    const levels = await storage.getAllGameLevels();
    res.status(200).json(levels);
  });
  
  app.get("/api/levels/:id", async (req, res) => {
    const levelId = parseInt(req.params.id);
    
    if (isNaN(levelId)) {
      return res.status(400).json({ message: "Invalid level ID" });
    }
    
    const level = await storage.getGameLevel(levelId);
    
    if (!level) {
      return res.status(404).json({ message: "Level not found" });
    }
    
    res.status(200).json(level);
  });
  
  app.get("/api/daily-puzzle", async (req, res) => {
    const dailyPuzzle = await storage.getDailyPuzzle();
    
    if (!dailyPuzzle) {
      return res.status(404).json({ message: "Daily puzzle not found" });
    }
    
    res.status(200).json(dailyPuzzle);
  });
  
  // Level progress routes
  app.get("/api/users/:userId/progress/:levelId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const levelId = parseInt(req.params.levelId);
    
    if (isNaN(userId) || isNaN(levelId)) {
      return res.status(400).json({ message: "Invalid user or level ID" });
    }
    
    const progress = await storage.getUserLevelProgress(userId, levelId);
    
    if (!progress) {
      return res.status(404).json({ message: "Progress not found" });
    }
    
    res.status(200).json(progress);
  });
  
  app.post("/api/users/:userId/progress", async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      // Ensure all required fields have values
      // Create a fully defined object with all required fields
      const progressData = {
        userId: userId,
        levelId: req.body.levelId ?? 1,
        completed: true,
        stars: req.body.stars ?? 1,
        wordsFound: req.body.wordsFound ?? [],
        timeSpent: req.body.timeSpent ?? 0,
        hintsUsed: req.body.hintsUsed ?? 0
      };
      
      const validatedData = insertUserLevelProgressSchema.parse(progressData);
      
      const progress = await storage.saveUserLevelProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      res.status(400).json({ message: "Invalid progress data" });
    }
  });
  
  // Leaderboard routes
  app.get("/api/leaderboard", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const entries = await storage.getLeaderboardEntries(limit);
    res.status(200).json(entries);
  });
  
  app.get("/api/leaderboard/weekly", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const entries = await storage.getWeeklyLeaderboard(limit);
    res.status(200).json(entries);
  });
  
  app.get("/api/leaderboard/daily", async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const entries = await storage.getDailyLeaderboard(limit);
    res.status(200).json(entries);
  });
  
  app.post("/api/leaderboard", async (req, res) => {
    try {
      const entryData = insertLeaderboardEntrySchema.parse(req.body);
      const entry = await storage.addLeaderboardEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid leaderboard entry data" });
    }
  });
  
  // Multiplayer room routes
  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertMultiplayerRoomSchema.parse(req.body);
      // Ensure maxPlayers has a value
      const roomWithDefaults = {
        ...roomData,
        maxPlayers: roomData.maxPlayers ?? 4
      };
      const room = await storage.createRoom(roomWithDefaults);
      res.status(201).json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });
  
  app.get("/api/rooms/:code", async (req, res) => {
    const code = req.params.code;
    const room = await storage.getRoomByCode(code);
    
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    
    res.status(200).json(room);
  });
  
  app.patch("/api/rooms/:id/status", async (req, res) => {
    const roomId = parseInt(req.params.id);
    
    if (isNaN(roomId)) {
      return res.status(400).json({ message: "Invalid room ID" });
    }
    
    const statusSchema = z.object({
      status: z.string()
    });
    
    try {
      const { status } = statusSchema.parse(req.body);
      const room = await storage.updateRoomStatus(roomId, status);
      
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      
      res.status(200).json(room);
    } catch (error) {
      res.status(400).json({ message: "Invalid status data" });
    }
  });

  return httpServer;
}
