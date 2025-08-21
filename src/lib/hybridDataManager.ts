import fs from 'fs';
import path from 'path';
import { Question, User, AdminConfig, ValidationResult } from '@/types';
import { DatabaseManager } from './database';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export class HybridDataManager {
  private static questionsPath = path.join(DATA_DIR, 'questions.json');
  private static usersPath = path.join(DATA_DIR, 'users.json');
  private static configPath = path.join(DATA_DIR, 'config.json');

  // Helper to determine if we're in production
  private static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
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
  static async validateUser(uuid: string): Promise<ValidationResult> {
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

      user.rateLimitData.consecutiveFailures += 1;
      user.rateLimitData.totalFailures += 1;
      user.lastActivity = new Date().toISOString();

      if (user.rateLimitData.consecutiveFailures >= 3) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 10);
        user.rateLimitData.lockedUntil = lockUntil.toISOString();
        users[userIndex] = user;
        await this.saveUsers(users);
        return { rateLimited: true, lockTimeRemaining: 600 };
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
      }

      return { rateLimited: false, lockTimeRemaining: 0 };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
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
