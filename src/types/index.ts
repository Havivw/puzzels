// Core data types for the Pazzel system

export interface Question {
  id: string;
  text: string;
  answer: string;
  hints?: string[];
  hintPassword?: string; // Single password for all hints
  order: number;
}

export interface User {
  uuid: string;
  name: string;
  currentQuestion: number;
  completedQuestions: string[];
  createdAt: string;
  lastActivity: string;
  rateLimitData?: {
    consecutiveFailures: number;
    lockedUntil?: string; // ISO timestamp when lock expires
    totalFailures: number;
  };
}

export interface UserProgress {
  name: string;
  percentage: number;
  completedCount: number;
  totalQuestions: number;
  lastActivity: string;
}

export interface AdminConfig {
  adminUuid: string;
  dashboardUuid: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface QuestionResponse {
  question: Question;
  isLastQuestion: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

export interface AnswerRequest {
  uuid: string;
  questionId: string;
  answer: string;
}

export interface HintRequest {
  uuid: string;
  questionId: string;
  password?: string;
}

export interface HintResponse {
  success: boolean;
  hints?: string[]; // All hints for the question
  requiresPassword: boolean;
  error?: string;
}

export interface AnswerResponse {
  correct: boolean;
  nextQuestion?: Question;
  completed?: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  rateLimited?: boolean;
  lockTimeRemaining?: number; // seconds remaining in lock
}

export interface DashboardData {
  totalUsers: number;
  averageCompletion: number;
  users: UserProgress[];
  lastUpdated: string;
}

export interface AdminDashboardData extends DashboardData {
  users: (UserProgress & { uuid: string })[];
}

export type UserRole = 'user' | 'admin' | 'dashboard';

export interface ValidationResult {
  valid: boolean;
  role: UserRole | null;
  user?: User;
}
