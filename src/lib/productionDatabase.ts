import { sql } from '@vercel/postgres';
import { Question, User, AdminConfig } from '@/types';

export class ProductionDatabase {
  // Initialize database tables
  static async initializeTables(): Promise<void> {
    try {
      // Create questions table
      await sql`
        CREATE TABLE IF NOT EXISTS questions (
          id VARCHAR(255) PRIMARY KEY,
          text TEXT NOT NULL,
          answer VARCHAR(500) NOT NULL,
          hints TEXT,
          hint_password VARCHAR(255),
          order_num INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          uuid VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          current_question INTEGER DEFAULT 1,
          completed_questions TEXT DEFAULT '[]',
          rate_limit_data TEXT DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create config table
      await sql`
        CREATE TABLE IF NOT EXISTS config (
          id SERIAL PRIMARY KEY,
          admin_uuid VARCHAR(255) NOT NULL,
          dashboard_uuid VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      console.log('Database tables initialized successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
    }
  }

  // Questions operations
  static async getQuestions(): Promise<Question[]> {
    try {
      const { rows } = await sql`SELECT * FROM questions ORDER BY order_num ASC`;
      return rows.map(row => ({
        id: row.id,
        text: row.text,
        answer: row.answer,
        hints: row.hints ? JSON.parse(row.hints) : [],
        hintPassword: row.hint_password || undefined,
        order: row.order_num
      }));
    } catch (error) {
      console.error('Error getting questions:', error);
      return [];
    }
  }

  static async saveQuestions(questions: Question[]): Promise<boolean> {
    try {
      // Clear existing questions
      await sql`DELETE FROM questions`;
      
      // Insert new questions
      for (const question of questions) {
        await sql`
          INSERT INTO questions (id, text, answer, hints, hint_password, order_num)
          VALUES (${question.id}, ${question.text}, ${question.answer}, 
                  ${JSON.stringify(question.hints || [])}, 
                  ${question.hintPassword || null}, ${question.order})
        `;
      }
      return true;
    } catch (error) {
      console.error('Error saving questions:', error);
      return false;
    }
  }

  // Users operations
  static async getUsers(): Promise<User[]> {
    try {
      const { rows } = await sql`SELECT * FROM users ORDER BY created_at DESC`;
      return rows.map(row => ({
        uuid: row.uuid,
        name: row.name,
        currentQuestion: row.current_question,
        completedQuestions: JSON.parse(row.completed_questions),
        rateLimitData: JSON.parse(row.rate_limit_data),
        createdAt: row.created_at.toISOString(),
        lastActivity: row.last_activity.toISOString()
      }));
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  static async saveUsers(users: User[]): Promise<boolean> {
    try {
      // Clear existing users
      await sql`DELETE FROM users`;
      
      // Insert new users
      for (const user of users) {
        await sql`
          INSERT INTO users (uuid, name, current_question, completed_questions, rate_limit_data, created_at, last_activity)
          VALUES (${user.uuid}, ${user.name}, ${user.currentQuestion}, 
                  ${JSON.stringify(user.completedQuestions)}, 
                  ${JSON.stringify(user.rateLimitData || {})},
                  ${user.createdAt}, ${user.lastActivity})
        `;
      }
      return true;
    } catch (error) {
      console.error('Error saving users:', error);
      return false;
    }
  }

  static async addUser(name: string, uuid: string): Promise<boolean> {
    try {
      await sql`
        INSERT INTO users (uuid, name, current_question, completed_questions, rate_limit_data, created_at, last_activity)
        VALUES (${uuid}, ${name}, 1, '[]', '{}', NOW(), NOW())
      `;
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    }
  }

  static async removeUser(uuid: string): Promise<boolean> {
    try {
      const result = await sql`DELETE FROM users WHERE uuid = ${uuid}`;
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    }
  }

  static async updateUserProgress(uuid: string, questionId: string): Promise<boolean> {
    try {
      const { rows } = await sql`SELECT completed_questions, current_question FROM users WHERE uuid = ${uuid}`;
      if (rows.length === 0) return false;

      const user = rows[0];
      const completedQuestions = JSON.parse(user.completed_questions);
      
      if (!completedQuestions.includes(questionId)) {
        completedQuestions.push(questionId);
      }

      await sql`
        UPDATE users 
        SET completed_questions = ${JSON.stringify(completedQuestions)},
            current_question = current_question + 1,
            rate_limit_data = '{}',
            last_activity = NOW()
        WHERE uuid = ${uuid}
      `;
      return true;
    } catch (error) {
      console.error('Error updating user progress:', error);
      return false;
    }
  }

  static async updateUserFailure(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining?: number }> {
    try {
      const { rows } = await sql`SELECT rate_limit_data FROM users WHERE uuid = ${uuid}`;
      if (rows.length === 0) return { rateLimited: false };

      const rateLimitData = JSON.parse(rows[0].rate_limit_data || '{}');
      rateLimitData.consecutiveFailures = (rateLimitData.consecutiveFailures || 0) + 1;
      rateLimitData.totalFailures = (rateLimitData.totalFailures || 0) + 1;

      let lockTimeRemaining = 0;
      if (rateLimitData.consecutiveFailures >= 3) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 10);
        rateLimitData.lockedUntil = lockUntil.toISOString();
        lockTimeRemaining = 600; // 10 minutes
      }

      await sql`
        UPDATE users 
        SET rate_limit_data = ${JSON.stringify(rateLimitData)},
            last_activity = NOW()
        WHERE uuid = ${uuid}
      `;

      return { 
        rateLimited: rateLimitData.consecutiveFailures >= 3, 
        lockTimeRemaining 
      };
    } catch (error) {
      console.error('Error updating user failure:', error);
      return { rateLimited: false };
    }
  }

  static async checkRateLimit(uuid: string): Promise<{ rateLimited: boolean; lockTimeRemaining: number }> {
    try {
      const { rows } = await sql`SELECT rate_limit_data FROM users WHERE uuid = ${uuid}`;
      if (rows.length === 0) return { rateLimited: false, lockTimeRemaining: 0 };

      const rateLimitData = JSON.parse(rows[0].rate_limit_data || '{}');
      
      if (rateLimitData.lockedUntil) {
        const lockUntil = new Date(rateLimitData.lockedUntil);
        const now = new Date();
        
        if (now < lockUntil) {
          const lockTimeRemaining = Math.ceil((lockUntil.getTime() - now.getTime()) / 1000);
          return { rateLimited: true, lockTimeRemaining };
        } else {
          // Lock expired, reset
          rateLimitData.consecutiveFailures = 0;
          delete rateLimitData.lockedUntil;
          
          await sql`
            UPDATE users 
            SET rate_limit_data = ${JSON.stringify(rateLimitData)}
            WHERE uuid = ${uuid}
          `;
        }
      }

      return { rateLimited: false, lockTimeRemaining: 0 };
    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { rateLimited: false, lockTimeRemaining: 0 };
    }
  }

  // Config operations
  static async getConfig(): Promise<AdminConfig> {
    try {
      const { rows } = await sql`SELECT * FROM config ORDER BY id DESC LIMIT 1`;
      if (rows.length > 0) {
        return {
          adminUuid: rows[0].admin_uuid,
          dashboardUuid: rows[0].dashboard_uuid
        };
      }
      
      // Return default config if none exists
      return {
        adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      };
    } catch (error) {
      console.error('Error getting config:', error);
      return {
        adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
        dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
      };
    }
  }

  static async saveConfig(config: AdminConfig): Promise<boolean> {
    try {
      // Clear existing config and insert new one
      await sql`DELETE FROM config`;
      await sql`
        INSERT INTO config (admin_uuid, dashboard_uuid)
        VALUES (${config.adminUuid}, ${config.dashboardUuid})
      `;
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  // Initialize with default data
  static async seedDefaultData(): Promise<void> {
    try {
      // Check if questions exist
      const { rows: questionRows } = await sql`SELECT COUNT(*) as count FROM questions`;
      if (questionRows[0].count === 0) {
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

      // Check if config exists
      const { rows: configRows } = await sql`SELECT COUNT(*) as count FROM config`;
      if (configRows[0].count === 0) {
        await this.saveConfig({
          adminUuid: 'admin-b290-6877-42c1-afe1-0e40f0098df6',
          dashboardUuid: 'dash-52dc-2330-49f1-89e9-00fb6440cd5b'
        });
      }

      console.log('Default data seeded successfully');
    } catch (error) {
      console.error('Error seeding default data:', error);
    }
  }
}
