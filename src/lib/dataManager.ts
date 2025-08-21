import fs from 'fs';
import path from 'path';
import { Question, User, AdminConfig, ValidationResult } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'src/data');

export class DataManager {
  private static questionsPath = path.join(DATA_DIR, 'questions.json');
  private static usersPath = path.join(DATA_DIR, 'users.json');
  private static configPath = path.join(DATA_DIR, 'config.json');

  // Read operations
  static getQuestions(): Question[] {
    try {
      const data = fs.readFileSync(this.questionsPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading questions:', error);
      return [];
    }
  }

  static getUsers(): User[] {
    try {
      const data = fs.readFileSync(this.usersPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading users:', error);
      return [];
    }
  }

  static getConfig(): AdminConfig {
    try {
      const data = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading config:', error);
      return { adminUuid: '', dashboardUuid: '' };
    }
  }

  // Write operations
  static saveQuestions(questions: Question[]): boolean {
    try {
      fs.writeFileSync(this.questionsPath, JSON.stringify(questions, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      return false;
    }
  }

  static saveUsers(users: User[]): boolean {
    try {
      fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  // Validation operations
  static validateUser(uuid: string): ValidationResult {
    const config = this.getConfig();
    
    // Check if admin
    if (uuid === config.adminUuid) {
      return { valid: true, role: 'admin' };
    }
    
    // Check if dashboard viewer
    if (uuid === config.dashboardUuid) {
      return { valid: true, role: 'dashboard' };
    }
    
    // Check if regular user
    const users = this.getUsers();
    const user = users.find(u => u.uuid === uuid);
    
    if (user) {
      return { valid: true, role: 'user', user };
    }
    
    return { valid: false, role: 'user' };
  }

  // User operations
  static updateUserProgress(uuid: string, questionId: string): boolean {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      
      if (userIndex === -1) return false;
      
      const user = users[userIndex];
      
      // Add to completed questions if not already there
      if (!user.completedQuestions.includes(questionId)) {
        user.completedQuestions.push(questionId);
      }
      
      // Move to next question
      user.currentQuestion = user.currentQuestion + 1;
      user.lastActivity = new Date().toISOString();
      
      // Reset rate limit data on successful answer
      if (user.rateLimitData) {
        user.rateLimitData.consecutiveFailures = 0;
        delete user.rateLimitData.lockedUntil;
      }
      
      users[userIndex] = user;
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error updating user progress:', error);
      return false;
    }
  }

  static updateUserFailure(uuid: string): { rateLimited: boolean; lockTimeRemaining?: number } {
    try {
      const users = this.getUsers();
      const userIndex = users.findIndex(u => u.uuid === uuid);
      
      if (userIndex === -1) return { rateLimited: false };
      
      const user = users[userIndex];
      
      // Initialize rate limit data if not exists
      if (!user.rateLimitData) {
        user.rateLimitData = {
          consecutiveFailures: 0,
          totalFailures: 0
        };
      }
      
      // Increment failure counts
      user.rateLimitData.consecutiveFailures += 1;
      user.rateLimitData.totalFailures += 1;
      user.lastActivity = new Date().toISOString();
      
      // Check if user should be rate limited (3 consecutive failures)
      if (user.rateLimitData.consecutiveFailures >= 3) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 10); // 10 minute lock
        user.rateLimitData.lockedUntil = lockUntil.toISOString();
        
        users[userIndex] = user;
        this.saveUsers(users);
        
        return { 
          rateLimited: true, 
          lockTimeRemaining: 600 // 10 minutes in seconds
        };
      }
      
      users[userIndex] = user;
      this.saveUsers(users);
      
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating user failure:', error);
      return { rateLimited: false };
    }
  }

  static checkRateLimit(uuid: string): { rateLimited: boolean; lockTimeRemaining?: number } {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.uuid === uuid);
      
      if (!user || !user.rateLimitData || !user.rateLimitData.lockedUntil) {
        return { rateLimited: false };
      }
      
      const lockUntil = new Date(user.rateLimitData.lockedUntil);
      const now = new Date();
      
      if (now < lockUntil) {
        const remainingMs = lockUntil.getTime() - now.getTime();
        const remainingSeconds = Math.ceil(remainingMs / 1000);
        
        return { 
          rateLimited: true, 
          lockTimeRemaining: remainingSeconds 
        };
      } else {
        // Lock has expired, reset consecutive failures
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex !== -1) {
          users[userIndex].rateLimitData!.consecutiveFailures = 0;
          delete users[userIndex].rateLimitData!.lockedUntil;
          this.saveUsers(users);
        }
        
        return { rateLimited: false };
      }
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { rateLimited: false };
    }
  }

  static addUser(name: string, uuid: string): boolean {
    try {
      const users = this.getUsers();
      
      // Check if UUID already exists
      if (users.find(u => u.uuid === uuid)) {
        return false;
      }
      
      const newUser: User = {
        uuid,
        name,
        currentQuestion: 1,
        completedQuestions: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      users.push(newUser);
      return this.saveUsers(users);
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  }

  static removeUser(uuid: string): boolean {
    try {
      const users = this.getUsers();
      const filteredUsers = users.filter(u => u.uuid !== uuid);
      
      if (filteredUsers.length === users.length) {
        return false; // User not found
      }
      
      return this.saveUsers(filteredUsers);
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }

  static updateConfig(newConfig: AdminConfig): boolean {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2));
      return true;
    } catch (error) {
      console.error('Error updating config:', error);
      return false;
    }
  }
}
