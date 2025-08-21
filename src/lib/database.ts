import { createClient } from 'redis';
import { Question, User, AdminConfig } from '@/types';

// Database keys for 'puzzel' Redis database
const KEYS = {
  QUESTIONS: 'puzzel:questions',
  USERS: 'puzzel:users',
  CONFIG: 'puzzel:config'
};

// Create Redis client instance
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    await redisClient.connect();
  }
  
  return redisClient;
}

export class DatabaseManager {
  // Questions operations
  static async getQuestions(): Promise<Question[]> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        const questions = await client.get(KEYS.QUESTIONS);
        return questions ? JSON.parse(questions) : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting questions from database:', error);
      return [];
    }
  }

  static async saveQuestions(questions: Question[]): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        await client.set(KEYS.QUESTIONS, JSON.stringify(questions));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving questions to database:', error);
      return false;
    }
  }

  // Users operations
  static async getUsers(): Promise<User[]> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        const users = await client.get(KEYS.USERS);
        return users ? JSON.parse(users) : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting users from database:', error);
      return [];
    }
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        await client.set(KEYS.USERS, JSON.stringify(users));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving users to database:', error);
      return false;
    }
  }

  // Config operations
  static async getConfig(): Promise<AdminConfig> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        const config = await client.get(KEYS.CONFIG);
        return config ? JSON.parse(config) : {
          adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
          dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
        };
      }
      return {
        adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      };
    } catch (error) {
      console.error('Error getting config from database:', error);
      return {
        adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      };
    }
  }

  static async saveConfig(config: AdminConfig): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const client = await getRedisClient();
        await client.set(KEYS.CONFIG, JSON.stringify(config));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving config to database:', error);
      return false;
    }
  }

  // User management operations
  static async addUser(name: string, uuid: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const users = await this.getUsers();
        const newUser = {
          uuid,
          name,
          currentQuestion: 1,
          completedQuestions: [],
          rateLimitData: {
            consecutiveFailures: 0,
            totalFailures: 0,
            hintPasswordFailures: 0
          },
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString()
        };
        users.push(newUser);
        return await this.saveUsers(users);
      }
      return false;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  }

  static async removeUser(uuid: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const users = await this.getUsers();
        const filteredUsers = users.filter(u => u.uuid !== uuid);
        if (filteredUsers.length === users.length) {
          return false; // User not found
        }
        return await this.saveUsers(filteredUsers);
      }
      return false;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }

  static async updateUserProgress(uuid: string, questionId: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
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
          // Also reset hint password failures on correct answer
          user.rateLimitData.hintPasswordFailures = 0;
          delete user.rateLimitData.hintPasswordLockedUntil;
        }
        
        user.lastActivity = new Date().toISOString();
        users[userIndex] = user;
        
        return await this.saveUsers(users);
      }
      return false;
    } catch (error) {
      console.error('Error updating user progress:', error);
      return false;
    }
  }

  static async updateUserFailure(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining?: number }> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const users = await this.getUsers();
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex === -1) return { rateLimited: false };

        const user = users[userIndex];
        if (!user.rateLimitData) {
          user.rateLimitData = { consecutiveFailures: 0, totalFailures: 0, hintPasswordFailures: 0 };
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
      }
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating user failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (process.env.NODE_ENV === 'production') {
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
      }
      return { rateLimited: false, lockTimeRemaining: 0 };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  // Hint password rate limiting
  static async updateHintPasswordFailure(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining?: number }> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const users = await this.getUsers();
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex === -1) return { rateLimited: false };

        const user = users[userIndex];
        if (!user.rateLimitData) {
          user.rateLimitData = { consecutiveFailures: 0, totalFailures: 0, hintPasswordFailures: 0 };
        }

        // Initialize hint password failures if not exists
        if (user.rateLimitData.hintPasswordFailures === undefined) {
          user.rateLimitData.hintPasswordFailures = 0;
        }

        user.rateLimitData.hintPasswordFailures += 1;
        user.lastActivity = new Date().toISOString();

        // Check if user should be rate limited (3 consecutive hint password failures)
        if (user.rateLimitData.hintPasswordFailures >= 3) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 25); // 25 minute lock for hint passwords
          user.rateLimitData.hintPasswordLockedUntil = lockUntil.toISOString();
          users[userIndex] = user;
          await this.saveUsers(users);
          return { rateLimited: true, lockTimeRemaining: 1500 }; // 25 minutes in seconds
        }

        users[userIndex] = user;
        await this.saveUsers(users);
        return { rateLimited: false };
      }
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating hint password failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkHintPasswordRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (process.env.NODE_ENV === 'production') {
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
          // Lock has expired, reset hint password failures
          const userIndex = users.findIndex(u => u.uuid === uuid);
          if (userIndex !== -1) {
            users[userIndex].rateLimitData!.hintPasswordFailures = 0;
            delete users[userIndex].rateLimitData!.hintPasswordLockedUntil;
            await this.saveUsers(users);
          }
          
          return { rateLimited: false, lockTimeRemaining: 0 };
        }
      }
      return { rateLimited: false, lockTimeRemaining: 0 };
    } catch (error) {
      console.error('Error checking hint password rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  static async resetHintPasswordFailures(uuid: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const users = await this.getUsers();
        const userIndex = users.findIndex(u => u.uuid === uuid);
        
        if (userIndex !== -1 && users[userIndex].rateLimitData) {
          users[userIndex].rateLimitData!.hintPasswordFailures = 0;
          delete users[userIndex].rateLimitData!.hintPasswordLockedUntil;
          await this.saveUsers(users);
        }
      }
    } catch (error) {
      console.error('Error resetting hint password failures:', error);
    }
  }

  // Initialize database with default data
  static async initializeDatabase(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'production') {
        return;
      }

      // Check if questions exist, if not, initialize with defaults
      const existingQuestions = await this.getQuestions();
      if (existingQuestions.length === 0) {
        const defaultQuestions: Question[] = [
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
        await this.saveQuestions(defaultQuestions);
      }

      // Check if users exist, if not, initialize with defaults
      const existingUsers = await this.getUsers();
      if (existingUsers.length === 0) {
        const defaultUsers: User[] = [
          {
            uuid: "user-demo-1234-5678-abcd-efgh",
            name: "Demo User",
            currentQuestion: 1,
            completedQuestions: [],
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
          }
        ];
        await this.saveUsers(defaultUsers);
      }

      // Initialize config if it doesn't exist
      const existingConfig = await this.getConfig();
      if (!existingConfig.adminUuid) {
        const defaultConfig: AdminConfig = {
          adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
          dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
        };
        await this.saveConfig(defaultConfig);
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}