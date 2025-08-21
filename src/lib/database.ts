import { kv } from '@vercel/kv';
import { Question, User, AdminConfig } from '@/types';

// Database keys
const KEYS = {
  QUESTIONS: 'pazzel:questions',
  USERS: 'pazzel:users',
  CONFIG: 'pazzel:config'
};

export class DatabaseManager {
  // Questions operations
  static async getQuestions(): Promise<Question[]> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const questions = await kv.get<Question[]>(KEYS.QUESTIONS);
        return questions || [];
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
        await kv.set(KEYS.QUESTIONS, questions);
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
        const users = await kv.get<User[]>(KEYS.USERS);
        return users || [];
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
        await kv.set(KEYS.USERS, users);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving users to database:', error);
      return false;
    }
  }

  // Config operations
  static async getConfig(): Promise<AdminConfig | null> {
    try {
      if (process.env.NODE_ENV === 'production') {
        const config = await kv.get<AdminConfig>(KEYS.CONFIG);
        return config;
      }
      return null;
    } catch (error) {
      console.error('Error getting config from database:', error);
      return null;
    }
  }

  static async saveConfig(config: AdminConfig): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'production') {
        await kv.set(KEYS.CONFIG, config);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving config to database:', error);
      return false;
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
      if (!existingConfig) {
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
