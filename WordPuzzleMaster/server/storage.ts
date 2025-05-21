import { 
  users, 
  type User, 
  type InsertUser,
  leaderboardEntries,
  type LeaderboardEntry,
  multiplayerRooms,
  type MultiplayerRoom,
  userLevelProgress,
  type UserLevelProgress,
  type GameLevel
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // Leaderboard operations
  getLeaderboardEntries(limit?: number): Promise<LeaderboardEntry[]>;
  getWeeklyLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  getDailyLeaderboard(limit?: number): Promise<LeaderboardEntry[]>;
  addLeaderboardEntry(entry: Omit<LeaderboardEntry, "id" | "timestamp">): Promise<LeaderboardEntry>;
  
  // Multiplayer room operations
  createRoom(room: Omit<MultiplayerRoom, "id" | "code" | "createdAt" | "status">): Promise<MultiplayerRoom>;
  getRoomByCode(code: string): Promise<MultiplayerRoom | undefined>;
  updateRoomStatus(id: number, status: string): Promise<MultiplayerRoom | undefined>;
  
  // Level progress operations
  getUserLevelProgress(userId: number, levelId: number): Promise<UserLevelProgress | undefined>;
  saveUserLevelProgress(progress: Omit<UserLevelProgress, "id">): Promise<UserLevelProgress>;
  
  // Game level operations (in-memory only)
  getGameLevel(id: number): Promise<GameLevel | undefined>;
  getAllGameLevels(): Promise<GameLevel[]>;
  getDailyPuzzle(): Promise<GameLevel | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leaderboard: Map<number, LeaderboardEntry>;
  private rooms: Map<number, MultiplayerRoom>;
  private progress: Map<string, UserLevelProgress>;
  private gameLevels: Map<number, GameLevel>;
  private dailyPuzzle: GameLevel | undefined;
  
  private userId: number;
  private leaderboardId: number;
  private roomId: number;
  private progressId: number;

  constructor() {
    this.users = new Map();
    this.leaderboard = new Map();
    this.rooms = new Map();
    this.progress = new Map();
    this.gameLevels = new Map();
    
    this.userId = 1;
    this.leaderboardId = 1;
    this.roomId = 1;
    this.progressId = 1;
    
    // Initialize with sample game levels
    this.initializeSampleLevels();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id, 
      coins: 500, 
      currentLevel: 1,
      hintsRemaining: 3,
      settings: {
        musicEnabled: true,
        sfxEnabled: true,
        theme: "magical",
        difficulty: "beginner"
      }
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  // Leaderboard operations
  async getLeaderboardEntries(limit: number = 10): Promise<LeaderboardEntry[]> {
    return Array.from(this.leaderboard.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  async getWeeklyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return Array.from(this.leaderboard.values())
      .filter(entry => new Date(entry.timestamp) >= oneWeekAgo)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  async getDailyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.leaderboard.values())
      .filter(entry => new Date(entry.timestamp) >= today)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  async addLeaderboardEntry(entry: Omit<LeaderboardEntry, "id" | "timestamp">): Promise<LeaderboardEntry> {
    const id = this.leaderboardId++;
    const newEntry: LeaderboardEntry = {
      ...entry,
      id,
      timestamp: new Date()
    };
    
    this.leaderboard.set(id, newEntry);
    return newEntry;
  }
  
  // Multiplayer room operations
  async createRoom(roomData: Omit<MultiplayerRoom, "id" | "code" | "createdAt" | "status">): Promise<MultiplayerRoom> {
    const id = this.roomId++;
    const code = this.generateRoomCode();
    
    const room: MultiplayerRoom = {
      ...roomData,
      id,
      code,
      status: "waiting",
      createdAt: new Date()
    };
    
    this.rooms.set(id, room);
    return room;
  }
  
  async getRoomByCode(code: string): Promise<MultiplayerRoom | undefined> {
    return Array.from(this.rooms.values()).find(room => room.code === code);
  }
  
  async updateRoomStatus(id: number, status: string): Promise<MultiplayerRoom | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;
    
    const updatedRoom = { ...room, status };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  // Level progress operations
  async getUserLevelProgress(userId: number, levelId: number): Promise<UserLevelProgress | undefined> {
    const key = `${userId}-${levelId}`;
    return this.progress.get(key);
  }
  
  async saveUserLevelProgress(progressData: Omit<UserLevelProgress, "id">): Promise<UserLevelProgress> {
    const id = this.progressId++;
    const key = `${progressData.userId}-${progressData.levelId}`;
    
    // Ensure all required fields have values
    const progress: UserLevelProgress = {
      id,
      userId: progressData.userId,
      levelId: progressData.levelId,
      completed: progressData.completed || true,
      stars: progressData.stars || 1,
      wordsFound: progressData.wordsFound || [],
      timeSpent: progressData.timeSpent || 0,
      hintsUsed: progressData.hintsUsed || 0
    };
    
    this.progress.set(key, progress);
    return progress;
  }
  
  // Game level operations
  async getGameLevel(id: number): Promise<GameLevel | undefined> {
    return this.gameLevels.get(id);
  }
  
  async getAllGameLevels(): Promise<GameLevel[]> {
    return Array.from(this.gameLevels.values());
  }
  
  async getDailyPuzzle(): Promise<GameLevel | undefined> {
    // In a real implementation, this would rotate daily
    return this.dailyPuzzle;
  }
  
  // Helper methods
  private generateRoomCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars
    let code = "";
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }
  
  private initializeSampleLevels() {
    // Sample level 1 - "PARK"
    const level1: GameLevel = {
      id: 1,
      name: "Forest Park",
      gridSize: { rows: 5, cols: 5 },
      grid: Array(5).fill(0).map(() => 
        Array(5).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "PARK",
          startPosition: { row: 1, col: 0 },
          direction: "across"
        },
        {
          text: "SPARK",
          startPosition: { row: 0, col: 2 },
          direction: "down"
        }
      ],
      availableLetters: ["P", "A", "R", "K", "S"]
    };
    
    // Fill grid based on words
    level1.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          level1.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          level1.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
    
    this.gameLevels.set(level1.id, level1);
    
    // Sample level 2
    const level2: GameLevel = {
      id: 2,
      name: "Mystic Mountain",
      gridSize: { rows: 5, cols: 5 },
      grid: Array(5).fill(0).map(() => 
        Array(5).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "MOUNT",
          startPosition: { row: 0, col: 0 },
          direction: "down"
        },
        {
          text: "MAGIC",
          startPosition: { row: 2, col: 0 },
          direction: "across"
        }
      ],
      availableLetters: ["M", "O", "U", "N", "T", "A", "G", "I", "C"]
    };
    
    // Fill grid based on words
    level2.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          level2.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          level2.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
    
    this.gameLevels.set(level2.id, level2);
    
    // Set daily puzzle (could rotate daily in a real implementation)
    this.dailyPuzzle = {
      id: 999,
      name: "Daily Challenge",
      gridSize: { rows: 6, cols: 6 },
      grid: Array(6).fill(0).map(() => 
        Array(6).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "MYSTIC",
          startPosition: { row: 0, col: 0 },
          direction: "across"
        },
        {
          text: "REALM",
          startPosition: { row: 0, col: 0 },
          direction: "down"
        },
        {
          text: "SPELL",
          startPosition: { row: 2, col: 1 },
          direction: "across"
        }
      ],
      availableLetters: ["M", "Y", "S", "T", "I", "C", "R", "E", "A", "L", "P"]
    };
    
    // Fill grid based on words
    this.dailyPuzzle.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          this.dailyPuzzle!.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          this.dailyPuzzle!.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
  }
}

import { db } from "./db";
import { eq, desc, and, gte } from "drizzle-orm";
import { nanoid } from "nanoid";

export class DatabaseStorage implements IStorage {
  private gameLevels: Map<number, GameLevel>;
  private dailyPuzzle: GameLevel | undefined;

  constructor() {
    this.gameLevels = new Map();
    // Initialize with sample game levels (these will still be in-memory)
    this.initializeSampleLevels();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        coins: 500,
        currentLevel: 1,
        hintsRemaining: 3,
        settings: {
          musicEnabled: true,
          sfxEnabled: true,
          theme: "magical",
          difficulty: "beginner"
        }
      })
      .returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Leaderboard operations
  async getLeaderboardEntries(limit: number = 10): Promise<LeaderboardEntry[]> {
    return await db
      .select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.score))
      .limit(limit);
  }
  
  async getWeeklyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return await db
      .select()
      .from(leaderboardEntries)
      .where(gte(leaderboardEntries.timestamp, oneWeekAgo))
      .orderBy(desc(leaderboardEntries.score))
      .limit(limit);
  }
  
  async getDailyLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return await db
      .select()
      .from(leaderboardEntries)
      .where(gte(leaderboardEntries.timestamp, today))
      .orderBy(desc(leaderboardEntries.score))
      .limit(limit);
  }
  
  async addLeaderboardEntry(entry: Omit<LeaderboardEntry, "id" | "timestamp">): Promise<LeaderboardEntry> {
    const [newEntry] = await db
      .insert(leaderboardEntries)
      .values(entry)
      .returning();
    
    return newEntry;
  }
  
  // Multiplayer room operations
  async createRoom(roomData: Omit<MultiplayerRoom, "id" | "code" | "createdAt" | "status">): Promise<MultiplayerRoom> {
    const code = this.generateRoomCode();
    
    const [room] = await db
      .insert(multiplayerRooms)
      .values({
        ...roomData,
        code,
        status: "waiting"
      })
      .returning();
    
    return room;
  }
  
  async getRoomByCode(code: string): Promise<MultiplayerRoom | undefined> {
    const [room] = await db
      .select()
      .from(multiplayerRooms)
      .where(eq(multiplayerRooms.code, code));
    
    return room;
  }
  
  async updateRoomStatus(id: number, status: string): Promise<MultiplayerRoom | undefined> {
    const [room] = await db
      .update(multiplayerRooms)
      .set({ status })
      .where(eq(multiplayerRooms.id, id))
      .returning();
    
    return room;
  }
  
  // Level progress operations
  async getUserLevelProgress(userId: number, levelId: number): Promise<UserLevelProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userLevelProgress)
      .where(
        and(
          eq(userLevelProgress.userId, userId),
          eq(userLevelProgress.levelId, levelId)
        )
      );
    
    return progress;
  }
  
  async saveUserLevelProgress(progressData: Omit<UserLevelProgress, "id">): Promise<UserLevelProgress> {
    // Check if progress already exists
    const existingProgress = await this.getUserLevelProgress(
      progressData.userId, 
      progressData.levelId
    );
    
    if (existingProgress) {
      // Update existing progress
      const [updated] = await db
        .update(userLevelProgress)
        .set(progressData)
        .where(eq(userLevelProgress.id, existingProgress.id))
        .returning();
      
      return updated;
    } else {
      // Create new progress
      const [newProgress] = await db
        .insert(userLevelProgress)
        .values(progressData)
        .returning();
      
      return newProgress;
    }
  }
  
  // Game level operations (still in-memory since they're not in the database)
  async getGameLevel(id: number): Promise<GameLevel | undefined> {
    return this.gameLevels.get(id);
  }
  
  async getAllGameLevels(): Promise<GameLevel[]> {
    return Array.from(this.gameLevels.values());
  }
  
  async getDailyPuzzle(): Promise<GameLevel | undefined> {
    return this.dailyPuzzle;
  }
  
  // Helper methods
  private generateRoomCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluded confusing chars
    let code = "";
    
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }
    
    return code;
  }
  
  private initializeSampleLevels() {
    // Sample level 1 - "PARK"
    const level1: GameLevel = {
      id: 1,
      name: "Forest Park",
      gridSize: { rows: 5, cols: 5 },
      grid: Array(5).fill(0).map(() => 
        Array(5).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "PARK",
          startPosition: { row: 1, col: 0 },
          direction: "across"
        },
        {
          text: "SPARK",
          startPosition: { row: 0, col: 2 },
          direction: "down"
        }
      ],
      availableLetters: ["P", "A", "R", "K", "S"]
    };
    
    // Fill grid based on words
    level1.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          level1.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          level1.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
    
    this.gameLevels.set(level1.id, level1);
    
    // Sample level 2
    const level2: GameLevel = {
      id: 2,
      name: "Mystic Mountain",
      gridSize: { rows: 5, cols: 5 },
      grid: Array(5).fill(0).map(() => 
        Array(5).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "MOUNT",
          startPosition: { row: 0, col: 0 },
          direction: "down"
        },
        {
          text: "MAGIC",
          startPosition: { row: 2, col: 0 },
          direction: "across"
        }
      ],
      availableLetters: ["M", "O", "U", "N", "T", "A", "G", "I", "C"]
    };
    
    // Fill grid based on words
    level2.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          level2.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          level2.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
    
    this.gameLevels.set(level2.id, level2);
    
    // Set daily puzzle (could rotate daily in a real implementation)
    this.dailyPuzzle = {
      id: 999,
      name: "Daily Challenge",
      gridSize: { rows: 6, cols: 6 },
      grid: Array(6).fill(0).map(() => 
        Array(6).fill(0).map(() => ({ 
          row: 0, 
          col: 0, 
          letter: "", 
          filled: false 
        }))
      ),
      words: [
        {
          text: "MYSTIC",
          startPosition: { row: 0, col: 0 },
          direction: "across"
        },
        {
          text: "REALM",
          startPosition: { row: 0, col: 0 },
          direction: "down"
        },
        {
          text: "SPELL",
          startPosition: { row: 2, col: 1 },
          direction: "across"
        }
      ],
      availableLetters: ["M", "Y", "S", "T", "I", "C", "R", "E", "A", "L", "P"]
    };
    
    // Fill grid based on words
    this.dailyPuzzle.words.forEach(word => {
      const { row, col } = word.startPosition;
      for (let i = 0; i < word.text.length; i++) {
        const letter = word.text[i];
        if (word.direction === "across") {
          this.dailyPuzzle!.grid[row][col + i] = { 
            row, 
            col: col + i, 
            letter, 
            filled: false 
          };
        } else {
          this.dailyPuzzle!.grid[row + i][col] = { 
            row: row + i, 
            col, 
            letter, 
            filled: false 
          };
        }
      }
    });
  }
}

// Replace MemStorage with DatabaseStorage for the application
export const storage = new DatabaseStorage();
