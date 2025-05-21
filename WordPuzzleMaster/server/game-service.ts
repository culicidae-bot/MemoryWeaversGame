import { 
  GameLevel, 
  Word, 
  GridPosition,
  User,
  UserLevelProgress,
  MultiplayerRoom
} from "@shared/schema";
import { storage } from "./storage";
import { generateId, shuffle } from "../client/src/lib/utils";

export interface GameStats {
  timeSpent: number;
  hintsUsed: number;
  wordsFound: string[];
}

export class GameService {
  /**
   * Retrieves a specific game level
   */
  async getLevel(id: number): Promise<GameLevel | null> {
    try {
      const level = await storage.getGameLevel(id);
      return level || null;
    } catch (error) {
      console.error("Error fetching level:", error);
      return null;
    }
  }

  /**
   * Retrieves all available game levels
   */
  async getAllLevels(): Promise<GameLevel[]> {
    try {
      return await storage.getAllGameLevels();
    } catch (error) {
      console.error("Error fetching all levels:", error);
      return [];
    }
  }

  /**
   * Retrieves the daily puzzle
   */
  async getDailyPuzzle(): Promise<GameLevel | null> {
    try {
      const puzzle = await storage.getDailyPuzzle();
      return puzzle || null;
    } catch (error) {
      console.error("Error fetching daily puzzle:", error);
      return null;
    }
  }

  /**
   * Calculates score based on level completion stats
   */
  calculateScore(stats: GameStats, difficulty: string = "beginner"): number {
    // Base score for completing the level
    let score = 100;
    
    // Add points for each word found
    score += stats.wordsFound.length * 20;
    
    // Time bonus
    if (stats.timeSpent < 60) { // Less than 1 minute
      score += 100;
    } else if (stats.timeSpent < 120) { // Less than 2 minutes
      score += 50;
    } else if (stats.timeSpent < 300) { // Less than 5 minutes
      score += 25;
    }
    
    // Difficulty multiplier
    const difficultyMultiplier = 
      difficulty === "mystic" ? 1.5 :
      difficulty === "normal" ? 1.2 :
      1.0;
    
    score = Math.round(score * difficultyMultiplier);
    
    // Penalty for using hints
    score -= stats.hintsUsed * 15;
    
    // Ensure minimum score
    return Math.max(10, score);
  }

  /**
   * Saves user progress for a level
   */
  async saveLevelProgress(
    userId: number, 
    levelId: number, 
    stats: GameStats
  ): Promise<UserLevelProgress | null> {
    try {
      // Get user to determine difficulty
      const user = await storage.getUser(userId);
      if (!user) return null;
      
      const difficulty = user.settings.difficulty || "beginner";
      
      // Calculate score and stars
      const score = this.calculateScore(stats, difficulty);
      const stars = this.calculateStars(stats);
      
      // Prepare progress data
      const progressData: Omit<UserLevelProgress, "id"> = {
        userId,
        levelId,
        completed: true,
        stars,
        wordsFound: stats.wordsFound,
        timeSpent: stats.timeSpent,
        hintsUsed: stats.hintsUsed
      };
      
      // Save progress
      const progress = await storage.saveUserLevelProgress(progressData);
      
      // Update user stats
      await storage.updateUser(userId, {
        coins: user.coins + score,
        currentLevel: Math.max(user.currentLevel, levelId + 1),
        hintsRemaining: user.hintsRemaining
      });
      
      // Add leaderboard entry
      await storage.addLeaderboardEntry({
        userId,
        score,
        level: levelId
      });
      
      return progress;
    } catch (error) {
      console.error("Error saving level progress:", error);
      return null;
    }
  }

  /**
   * Calculates stars based on performance (0-3)
   */
  private calculateStars(stats: GameStats): number {
    let stars = 3;
    
    // Deduct star for each hint used (up to 2)
    stars -= Math.min(2, stats.hintsUsed);
    
    // Deduct star for slow completion
    if (stats.timeSpent > 300) { // Over 5 minutes
      stars--;
    }
    
    return Math.max(1, stars); // Minimum 1 star
  }

  /**
   * Creates a new word puzzle level
   */
  createLevel(
    id: number,
    name: string,
    words: string[],
    gridSize: { rows: number; cols: number } = { rows: 5, cols: 5 }
  ): GameLevel {
    // Initialize empty grid
    const grid: GridPosition[][] = Array(gridSize.rows)
      .fill(0)
      .map((_, rowIndex) => 
        Array(gridSize.cols)
          .fill(0)
          .map((_, colIndex) => ({
            row: rowIndex,
            col: colIndex,
            letter: "",
            filled: false
          }))
      );
    
    // Create word objects and place them in the grid
    const wordObjects: Word[] = [];
    
    // Sort words by length (longest first)
    const sortedWords = [...words].sort((a, b) => b.length - a.length);
    
    // Place words in the grid
    for (let i = 0; i < sortedWords.length; i++) {
      const word = sortedWords[i];
      const direction = i % 2 === 0 ? "across" : "down";
      
      // Find a suitable position for the word
      const position = this.findWordPosition(grid, word, direction, gridSize);
      
      if (position) {
        // Place the word in the grid
        this.placeWordInGrid(grid, word, position, direction);
        
        // Add to word objects
        wordObjects.push({
          text: word,
          startPosition: position,
          direction
        });
      }
    }
    
    // Collect all unique letters used in words
    const allLetters = new Set<string>();
    words.forEach(word => {
      word.split('').forEach(letter => {
        allLetters.add(letter);
      });
    });
    
    // Convert to array and shuffle
    const availableLetters = shuffle(Array.from(allLetters));
    
    return {
      id,
      name,
      gridSize,
      grid,
      words: wordObjects,
      availableLetters
    };
  }

  /**
   * Find a suitable position for a word in the grid
   */
  private findWordPosition(
    grid: GridPosition[][],
    word: string,
    direction: "across" | "down",
    gridSize: { rows: number; cols: number }
  ): { row: number; col: number } | null {
    // For each potential starting position
    for (let row = 0; row < gridSize.rows; row++) {
      for (let col = 0; col < gridSize.cols; col++) {
        if (this.canPlaceWord(grid, word, { row, col }, direction, gridSize)) {
          return { row, col };
        }
      }
    }
    
    return null; // No suitable position found
  }

  /**
   * Check if a word can be placed at a given position and direction
   */
  private canPlaceWord(
    grid: GridPosition[][],
    word: string,
    position: { row: number; col: number },
    direction: "across" | "down",
    gridSize: { rows: number; cols: number }
  ): boolean {
    const { row, col } = position;
    
    // Check if word fits within the grid
    if (direction === "across" && col + word.length > gridSize.cols) {
      return false;
    }
    if (direction === "down" && row + word.length > gridSize.rows) {
      return false;
    }
    
    // Check if the position is available for each letter
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === "across" ? row : row + i;
      const currentCol = direction === "across" ? col + i : col;
      
      // Get the current cell
      const cell = grid[currentRow][currentCol];
      
      // Check if cell is already filled with a different letter
      if (cell.letter !== "" && cell.letter !== word[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Place a word in the grid
   */
  private placeWordInGrid(
    grid: GridPosition[][],
    word: string,
    position: { row: number; col: number },
    direction: "across" | "down"
  ): void {
    const { row, col } = position;
    
    for (let i = 0; i < word.length; i++) {
      const currentRow = direction === "across" ? row : row + i;
      const currentCol = direction === "across" ? col + i : col;
      
      grid[currentRow][currentCol].letter = word[i];
    }
  }

  /**
   * Create a multiplayer room
   */
  async createMultiplayerRoom(
    hostId: number,
    levelId: number,
    maxPlayers: number = 4
  ): Promise<MultiplayerRoom | null> {
    try {
      // Verify user exists
      const host = await storage.getUser(hostId);
      if (!host) return null;
      
      // Verify level exists
      const level = await storage.getGameLevel(levelId);
      if (!level) return null;
      
      // Create room
      const room = await storage.createRoom({
        hostId,
        levelId,
        maxPlayers: Math.min(8, Math.max(2, maxPlayers)) // Between 2 and 8 players
      });
      
      return room;
    } catch (error) {
      console.error("Error creating multiplayer room:", error);
      return null;
    }
  }

  /**
   * Get a multiplayer room by code
   */
  async getMultiplayerRoom(code: string): Promise<MultiplayerRoom | null> {
    try {
      const room = await storage.getRoomByCode(code);
      return room || null;
    } catch (error) {
      console.error("Error getting multiplayer room:", error);
      return null;
    }
  }

  /**
   * Update room status
   */
  async updateRoomStatus(
    roomId: number,
    status: string
  ): Promise<MultiplayerRoom | null> {
    try {
      const room = await storage.updateRoomStatus(roomId, status);
      return room || null;
    } catch (error) {
      console.error("Error updating room status:", error);
      return null;
    }
  }
}

export const gameService = new GameService();
