import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  coins: integer("coins").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1),
  hintsRemaining: integer("hints_remaining").notNull().default(3),
  settings: jsonb("settings").notNull().default({
    musicEnabled: true,
    sfxEnabled: true,
    theme: "magical",
    difficulty: "beginner"
  })
});

export const leaderboardEntries = pgTable("leaderboard_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  level: integer("level").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

export const multiplayerRooms = pgTable("multiplayer_rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: integer("host_id").notNull().references(() => users.id),
  levelId: integer("level_id").notNull(),
  maxPlayers: integer("max_players").notNull().default(4),
  status: text("status").notNull().default("waiting"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const userLevelProgress = pgTable("user_level_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  levelId: integer("level_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  stars: integer("stars").notNull().default(0),
  wordsFound: jsonb("words_found").notNull().default([]),
  timeSpent: integer("time_spent").notNull().default(0),
  hintsUsed: integer("hints_used").notNull().default(0)
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertLeaderboardEntrySchema = createInsertSchema(leaderboardEntries).pick({
  userId: true,
  score: true,
  level: true
});

export const insertMultiplayerRoomSchema = createInsertSchema(multiplayerRooms).pick({
  hostId: true,
  levelId: true,
  maxPlayers: true
});

export const insertUserLevelProgressSchema = createInsertSchema(userLevelProgress).pick({
  userId: true,
  levelId: true,
  completed: true,
  stars: true,
  wordsFound: true,
  timeSpent: true,
  hintsUsed: true
});

// Game types not stored in database
export type GridPosition = {
  row: number;
  col: number;
  letter: string;
  filled: boolean;
};

export type WordDirection = "across" | "down";

export type Word = {
  text: string;
  startPosition: { row: number; col: number };
  direction: WordDirection;
};

export type GameLevel = {
  id: number;
  name: string;
  gridSize: { rows: number; cols: number };
  grid: GridPosition[][];
  words: Word[];
  availableLetters: string[];
};

export type UserGameState = {
  foundWords: string[];
  currentLevel: GameLevel;
  progress: number; // 0-100
};

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;
export type MultiplayerRoom = typeof multiplayerRooms.$inferSelect;
export type UserLevelProgress = typeof userLevelProgress.$inferSelect;
