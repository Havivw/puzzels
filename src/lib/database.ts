import { createClient } from 'redis';
import { Question, User, AdminConfig, HintRoute } from '@/types';

// Database keys for 'puzzel' Redis database
const KEYS = {
  QUESTIONS: 'puzzel:questions',
  USERS: 'puzzel:users',
  CONFIG: 'puzzel:config',
  HINT_ROUTES: 'puzzel:hint_routes'
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
  // Helper to get rate limit configuration with defaults
  private static async getRateLimitConfig() {
    try {
      const config = await this.getConfig();
      return config.rateLimitConfig || {
        answerAttempts: { maxFailures: 3, lockTimeMinutes: 10 },
        hintPasswordAttempts: { maxFailures: 3, lockTimeMinutes: 25 }
      };
    } catch (error) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        console.log('[REDIS] Saving users to Redis, count:', users.length);
        const client = await getRedisClient();
        const serializedUsers = JSON.stringify(users);
        console.log('[REDIS] Serialized users size:', serializedUsers.length, 'bytes');
        
        await client.set(KEYS.USERS, serializedUsers);
        
        // Verify the save by reading back
        const verification = await client.get(KEYS.USERS);
        const success = verification !== null;
        console.log('[REDIS] Save verification:', success ? 'SUCCESS' : 'FAILED');
        
        if (!success) {
          console.error('[REDIS] Critical: Users data was not saved to Redis!');
          return false;
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('[REDIS] Error saving users to Redis:', error);
      return false;
    }
  }

  // Config operations
  static async getConfig(): Promise<AdminConfig> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        const users = await this.getUsers();
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex === -1) return { rateLimited: false };

        const user = users[userIndex];
        if (!user.rateLimitData) {
          user.rateLimitData = { consecutiveFailures: 0, totalFailures: 0, hintPasswordFailures: 0 };
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
      }
      return { rateLimited: false };
    } catch (error) {
      console.error('Error updating user failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        console.log('[HINT_RATE_LIMIT] Updating hint password failure for user:', uuid);
        const users = await this.getUsers();
        const userIndex = users.findIndex(u => u.uuid === uuid);
        if (userIndex === -1) {
          console.log('[HINT_RATE_LIMIT] User not found:', uuid);
          return { rateLimited: false };
        }

        const user = users[userIndex];
        if (!user.rateLimitData) {
          user.rateLimitData = { consecutiveFailures: 0, totalFailures: 0, hintPasswordFailures: 0 };
          console.log('[HINT_RATE_LIMIT] Initialized rate limit data for user:', uuid);
        }

        // Initialize hint password failures if not exists
        if (user.rateLimitData.hintPasswordFailures === undefined) {
          user.rateLimitData.hintPasswordFailures = 0;
        }

        const previousFailures = user.rateLimitData.hintPasswordFailures;
        user.rateLimitData.hintPasswordFailures += 1;
        user.lastActivity = new Date().toISOString();

        console.log('[HINT_RATE_LIMIT] Hint password failures:', previousFailures, '->', user.rateLimitData.hintPasswordFailures);

        // Get configurable rate limit settings for hint passwords
        const rateLimitConfig = await this.getRateLimitConfig();
        const { maxFailures, lockTimeMinutes } = rateLimitConfig.hintPasswordAttempts;

        console.log('[HINT_RATE_LIMIT] Rate limit config - maxFailures:', maxFailures, 'lockTimeMinutes:', lockTimeMinutes);

        // Check if user should be rate limited
        if (user.rateLimitData.hintPasswordFailures >= maxFailures) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + lockTimeMinutes);
          user.rateLimitData.hintPasswordLockedUntil = lockUntil.toISOString();
          users[userIndex] = user;
          
          console.log('[HINT_RATE_LIMIT] User rate limited until:', lockUntil.toISOString());
          
          const saveResult = await this.saveUsers(users);
          console.log('[HINT_RATE_LIMIT] Save users result:', saveResult);
          
          return { 
            rateLimited: true, 
            lockTimeRemaining: lockTimeMinutes * 60 // Convert minutes to seconds
          };
        }

        users[userIndex] = user;
        const saveResult = await this.saveUsers(users);
        console.log('[HINT_RATE_LIMIT] Save users result (no rate limit):', saveResult);
        
        return { rateLimited: false };
      }
      return { rateLimited: false };
    } catch (error) {
      console.error('[HINT_RATE_LIMIT] Error updating hint password failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkHintPasswordRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        console.log('[HINT_RATE_LIMIT] Checking hint password rate limit for user:', uuid);
        const users = await this.getUsers();
        const user = users.find(u => u.uuid === uuid);
        
        if (!user) {
          console.log('[HINT_RATE_LIMIT] User not found:', uuid);
          return { rateLimited: false, lockTimeRemaining: 0 };
        }
        
        if (!user.rateLimitData || !user.rateLimitData.hintPasswordLockedUntil) {
          console.log('[HINT_RATE_LIMIT] No rate limit data or lock time for user:', uuid);
          return { rateLimited: false, lockTimeRemaining: 0 };
        }
        
        const lockUntil = new Date(user.rateLimitData.hintPasswordLockedUntil);
        const now = new Date();
        
        console.log('[HINT_RATE_LIMIT] Lock until:', lockUntil.toISOString(), 'Now:', now.toISOString());
        
        if (now < lockUntil) {
          const lockTimeRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 1000);
          console.log('[HINT_RATE_LIMIT] User is rate limited. Time remaining:', lockTimeRemaining, 'seconds');
          return { 
            rateLimited: true, 
            lockTimeRemaining 
          };
        } else {
          console.log('[HINT_RATE_LIMIT] Lock has expired, resetting failures');
          // Lock has expired, reset hint password failures AND answer failures
          const userIndex = users.findIndex(u => u.uuid === uuid);
          if (userIndex !== -1) {
            users[userIndex].rateLimitData!.hintPasswordFailures = 0;
            delete users[userIndex].rateLimitData!.hintPasswordLockedUntil;
            // Also reset answer failures when hint password lock expires
            users[userIndex].rateLimitData!.consecutiveFailures = 0;
            delete users[userIndex].rateLimitData!.lockedUntil;
            const saveResult = await this.saveUsers(users);
            console.log('[HINT_RATE_LIMIT] Reset failures save result:', saveResult);
          }
          
          return { rateLimited: false, lockTimeRemaining: 0 };
        }
      }
      return { rateLimited: false, lockTimeRemaining: 0 };
    } catch (error) {
      console.error('[HINT_RATE_LIMIT] Error checking hint password rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  static async resetHintPasswordFailures(uuid: string): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
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
      }
    } catch (error) {
      console.error('Error resetting hint password failures:', error);
    }
  }

  // Hint routes operations
  static async getHintRoutes(): Promise<HintRoute[]> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        const client = await getRedisClient();
        const routes = await client.get(KEYS.HINT_ROUTES);
        return routes ? JSON.parse(routes) : [];
      }
      return [];
    } catch (error) {
      console.error('Error getting hint routes from database:', error);
      return [];
    }
  }

  static async saveHintRoutes(routes: HintRoute[]): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        const client = await getRedisClient();
        await client.set(KEYS.HINT_ROUTES, JSON.stringify(routes));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving hint routes to database:', error);
      return false;
    }
  }

  static async addHintRoute(route: HintRoute): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        const routes = await this.getHintRoutes();
        routes.push(route);
        return await this.saveHintRoutes(routes);
      }
      return false;
    } catch (error) {
      console.error('Error adding hint route:', error);
      return false;
    }
  }

  static async removeHintRoute(uuid: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production' || process.env.REDIS_URL) {
        const routes = await this.getHintRoutes();
        const filteredRoutes = routes.filter(r => r.uuid !== uuid);
        if (filteredRoutes.length === routes.length) {
          return false; // Route not found
        }
        return await this.saveHintRoutes(filteredRoutes);
      }
      return false;
    } catch (error) {
      console.error('Error removing hint route:', error);
      return false;
    }
  }

  // Initialize database with default data
  static async initializeDatabase(): Promise<void> {
    try {
      if (process.env.NODE_ENV !== 'production' && !process.env.REDIS_URL) {
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

      // Initialize hint routes if they don't exist
      const existingHintRoutes = await this.getHintRoutes();
      if (existingHintRoutes.length === 0) {
        const defaultHintRoutes: HintRoute[] = [
          {
            uuid: 'hint-demo-1234-5678-abcd-efgh',
            content: 'This is a demo hint route. You can create your own custom hint pages!',
            createdAt: new Date().toISOString(),
            isActive: true
          }
        ];
        await this.saveHintRoutes(defaultHintRoutes);
      }

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
}