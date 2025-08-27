import fs from 'fs';
import path from 'path';
import { Question, User, AdminConfig, InternalValidationResult, HintRoute } from '@/types';
import { DatabaseManager } from './database';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export class HybridDataManager {
  private static questionsPath = path.join(DATA_DIR, 'questions.json');
  private static usersPath = path.join(DATA_DIR, 'users.json');
  private static configPath = path.join(DATA_DIR, 'config.json');

  // Helper to determine if we're in production
  private static isProduction(): boolean {
    return process.env.NODE_ENV === 'production' || !!process.env.REDIS_URL;
  }

  // Helper to get rate limit configuration with defaults
  private static async getRateLimitConfig() {
    try {
      const config = await this.getConfig();
      return config.rateLimitConfig || {
        answerAttempts: { maxFailures: 3, lockTimeMinutes: 10 },
        hintPasswordAttempts: { maxFailures: 3, lockTimeMinutes: 25 }
      };
    } catch {
      // Return defaults if config fails to load
      return {
        answerAttempts: { maxFailures: 3, lockTimeMinutes: 10 },
        hintPasswordAttempts: { maxFailures: 3, lockTimeMinutes: 25 }
      };
    }
  }

  // Questions operations
  static async getQuestions(): Promise<Question[]> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.getQuestions();
      }

      const data = fs.readFileSync(this.questionsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading questions:', error);
      return [
        {
          id: "q1",
          text: "What has keys but can't open locks?",
          answer: "piano",
          hints: ["It makes music", "You press them to create sound"],
          hintPassword: "music123",
          order: 1
        },
        {
          id: "q2",
          text: "I am tall when I am young, and short when I am old. What am I?",
          answer: "candle",
          hints: ["I give light", "I melt as time passes"],
          hintPassword: "light789",
          order: 2
        },
        {
          id: "q3",
          text: "What gets wet while drying?",
          answer: "towel",
          hints: ["Used in bathrooms", "Made of fabric"],
          order: 3
        }
      ];
    }
  }

  static async saveQuestions(questions: Question[]): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.saveQuestions(questions);
      }

      fs.writeFileSync(this.questionsPath, JSON.stringify(questions, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      return false;
    }
  }

  // Users operations
  static async getUsers(): Promise<User[]> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.getUsers();
      }

      const data = fs.readFileSync(this.usersPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [
        {
          uuid: "user-demo-1234-5678-abcd-efgh",
          name: "Demo User",
          currentQuestion: 1,
          completedQuestions: [],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        }
      ];
    }
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.saveUsers(users);
      }

      fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  static async addUser(name: string, uuid: string): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.addUser(name, uuid);
      }

      const users = await this.getUsers();
      const newUser: User = {
        uuid,
        name,
        currentQuestion: 1,
        completedQuestions: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      users.push(newUser);
      return await this.saveUsers(users);
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  }

  static async removeUser(uuid: string): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.removeUser(uuid);
      }

      const users = await this.getUsers();
      const filteredUsers = users.filter(u => u.uuid !== uuid);
      
      if (filteredUsers.length === users.length) {
        return false; // User not found
      }
      
      return await this.saveUsers(filteredUsers);
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }

  // Config operations
  static async getConfig(): Promise<AdminConfig> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.getConfig();
      }

      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config:', error);
      return {
        adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      };
    }
  }

  static async updateConfig(newConfig: AdminConfig): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.saveConfig(newConfig);
      }

      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }

  // Validation operations
  static async validateUser(uuid: string): Promise<InternalValidationResult> {
    const config = await this.getConfig();
    
    if (uuid === config.adminUuid) {
      return { valid: true, role: 'admin' };
    }
    
    if (uuid === config.dashboardUuid) {
      return { valid: true, role: 'dashboard' };
    }

    const users = await this.getUsers();
    const user = users.find(u => u.uuid === uuid);
    
    if (user) {
      return { valid: true, role: 'user', user };
    }

    return { valid: false, role: null };
  }

  // Progress tracking
  static async updateUserProgress(uuid: string, questionId: string): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.updateUserProgress(uuid, questionId);
      }

      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      if (userIndex === -1) return false;

      const user = users[userIndex];
      if (!user.completedQuestions.includes(questionId)) {
        user.completedQuestions.push(questionId);
        user.currentQuestion += 1;
      }
      
      // Reset rate limiting on correct answer
      if (user.rateLimitData) {
        user.rateLimitData.consecutiveFailures = 0;
        delete user.rateLimitData.lockedUntil;
      }
      
      user.lastActivity = new Date().toISOString();
      users[userIndex] = user;
      
      return await this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user progress:', error);
      return false;
    }
  }

  static async updateUserFailure(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining?: number }> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.updateUserFailure(uuid);
      }

      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      if (userIndex === -1) return { rateLimited: false };

      const user = users[userIndex];
      if (!user.rateLimitData) {
        user.rateLimitData = { consecutiveFailures: 0, totalFailures: 0 };
      }

      // Get configurable rate limit settings
      const rateLimitConfig = await this.getRateLimitConfig();
      const { maxFailures, lockTimeMinutes } = rateLimitConfig.answerAttempts;

      user.rateLimitData.consecutiveFailures += 1;
      user.rateLimitData.totalFailures += 1;
      user.lastActivity = new Date().toISOString();

      if (user.rateLimitData.consecutiveFailures >= maxFailures) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockTimeMinutes);
        user.rateLimitData.lockedUntil = lockUntil.toISOString();
        users[userIndex] = user;
        await this.saveUsers(users);
        return { 
          rateLimited: true, 
          lockTimeRemaining: lockTimeMinutes * 60 // Convert minutes to seconds
        };
      }

      users[userIndex] = user;
      await this.saveUsers(users);
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating user failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.checkRateLimit(uuid);
      }

      const users = await this.getUsers();
      const user = users.find(u => u.uuid === uuid);
      if (!user || !user.rateLimitData || !user.rateLimitData.lockedUntil) {
        return { rateLimited: false, lockTimeRemaining: 0 };
      }

      const lockUntil = new Date(user.rateLimitData.lockedUntil);
      const now = new Date();

      if (now < lockUntil) {
        const lockTimeRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 1000);
        return { rateLimited: true, lockTimeRemaining };
      } else {
        // Lock has expired, reset answer failures
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex !== -1) {
          users[userIndex].rateLimitData!.consecutiveFailures = 0;
          delete users[userIndex].rateLimitData!.lockedUntil;
          await this.saveUsers(users);
        }
        
        return { rateLimited: false, lockTimeRemaining: 0 };
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  // Hint password rate limiting
  static async updateHintPasswordFailure(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining?: number }> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.updateHintPasswordFailure(uuid);
      }

      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      
      if (userIndex === -1) return { rateLimited: false };
      
      const user = users[userIndex];
      
      // Initialize rate limit data if not exists
      if (!user.rateLimitData) {
        user.rateLimitData = {
          consecutiveFailures: 0,
          totalFailures: 0,
          hintPasswordFailures: 0
        };
      }
      
      // Initialize hint password failures if not exists
      if (user.rateLimitData.hintPasswordFailures === undefined) {
        user.rateLimitData.hintPasswordFailures = 0;
      }
      
      // Increment hint password failure count
      user.rateLimitData.hintPasswordFailures += 1;
      user.lastActivity = new Date().toISOString();
      
      // Get configurable rate limit settings for hint passwords
      const rateLimitConfig = await this.getRateLimitConfig();
      const { maxFailures, lockTimeMinutes } = rateLimitConfig.hintPasswordAttempts;

      // Check if user should be rate limited
      if (user.rateLimitData.hintPasswordFailures >= maxFailures) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + lockTimeMinutes);
        user.rateLimitData.hintPasswordLockedUntil = lockUntil.toISOString();
        
        users[userIndex] = user;
        await this.saveUsers(users);
        
        return { 
          rateLimited: true, 
          lockTimeRemaining: lockTimeMinutes * 60 // Convert minutes to seconds
        };
      }
      
      users[userIndex] = user;
      await this.saveUsers(users);
      
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating hint password failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkHintPasswordRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.checkHintPasswordRateLimit(uuid);
      }

      const users = await this.getUsers();
      const user = users.find(u => u.uuid === uuid);
      
      if (!user || !user.rateLimitData || !user.rateLimitData.hintPasswordLockedUntil) {
        return { rateLimited: false, lockTimeRemaining: 0 };
      }
      
      const lockUntil = new Date(user.rateLimitData.hintPasswordLockedUntil);
      const now = new Date();
      
      if (now < lockUntil) {
        const lockTimeRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 1000);
        return { 
          rateLimited: true, 
          lockTimeRemaining 
        };
      } else {
        // Lock has expired, reset hint password failures AND answer failures
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex !== -1) {
          users[userIndex].rateLimitData!.hintPasswordFailures = 0;
          delete users[userIndex].rateLimitData!.hintPasswordLockedUntil;
          // Also reset answer failures when hint password lock expires
          users[userIndex].rateLimitData!.consecutiveFailures = 0;
          delete users[userIndex].rateLimitData!.lockedUntil;
          await this.saveUsers(users);
        }
        
        return { rateLimited: false, lockTimeRemaining: 0 };
      }
    } catch (error) {
      console.error('Error checking hint password rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  static async resetHintPasswordFailures(uuid: string): Promise<void> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.resetHintPasswordFailures(uuid);
      }

      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      
      if (userIndex !== -1 && users[userIndex].rateLimitData) {
        users[userIndex].rateLimitData!.hintPasswordFailures = 0;
        delete users[userIndex].rateLimitData!.hintPasswordLockedUntil;
        // Also reset answer failures when hint password failures are reset
        users[userIndex].rateLimitData!.consecutiveFailures = 0;
        delete users[userIndex].rateLimitData!.lockedUntil;
        await this.saveUsers(users);
      }
    } catch (error) {
      console.error('Error resetting hint password failures:', error);
    }
  }

  // Hint routes operations
  static async getHintRoutes(): Promise<HintRoute[]> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.getHintRoutes();
      }

      // For development, return empty array (no JSON file for hint routes)
      return [];
    } catch (error) {
      console.error('Error getting hint routes:', error);
      return [];
    }
  }

  static async saveHintRoutes(routes: HintRoute[]): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.saveHintRoutes(routes);
      }

      // For development, return false (no JSON file for hint routes)
      return false;
    } catch (error) {
      console.error('Error saving hint routes:', error);
      return false;
    }
  }

  static async addHintRoute(route: HintRoute): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.addHintRoute(route);
      }

      // For development, return false (no JSON file for hint routes)
      return false;
    } catch (error) {
      console.error('Error adding hint route:', error);
      return false;
    }
  }

  static async removeHintRoute(uuid: string): Promise<boolean> {
    try {
      if (this.isProduction()) {
        return await DatabaseManager.removeHintRoute(uuid);
      }

      // For development, return false (no JSON file for hint routes)
      return false;
    } catch (error) {
      console.error('Error removing hint route:', error);
      return false;
    }
  }

  // Dashboard data
  static async getDashboardData(): Promise<{
    totalUsers: number;
    averageProgress: number;
    totalCompletions: number;
    users: Array<{
      name: string;
      completedCount: number;
      totalQuestions: number;
      lastActivity: string;
    }>;
  }> {
    try {
      const users = await this.getUsers();
      const questions = await this.getQuestions();

      const totalUsers = users.length;
      const averageProgress = totalUsers > 0 
        ? users.reduce((sum, user) => sum + (user.completedQuestions.length / questions.length) * 100, 0) / totalUsers 
        : 0;
      const totalCompletions = users.filter(user => user.completedQuestions.length === questions.length).length;

      return {
        totalUsers,
        averageProgress: Math.round(averageProgress),
        totalCompletions,
        users: users.map(user => ({
          name: user.name,
          completedCount: user.completedQuestions.length,
          totalQuestions: questions.length,
          lastActivity: user.lastActivity
        }))
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      return { totalUsers: 0, averageProgress: 0, totalCompletions: 0, users: [] };
    }
  }

  // Initialize database for production
  static async initializeProduction(): Promise<void> {
    if (this.isProduction()) {
      await DatabaseManager.initializeDatabase();
    }
  }
}
