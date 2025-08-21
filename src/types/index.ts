// Core data types for the Pazzel system

export interface Question {
  id: string;
  text: string;
  answer: string;
  hints?: string[];
  hintPassword?: string; // Single password for all hints
  order: number;
}

// Safe question type that excludes sensitive data for client responses
export interface SafeQuestion {
  id: string;
  text: string;
  order: number;
}

// Safe user type that excludes sensitive data for client responses
export interface SafeUser {
  uuid: string;
  name: string;
  currentQuestion: number;
  completedQuestions: string[];
  createdAt: string;
  lastActivity: string;
  // Deliberately excludes: rateLimitData
}

// Safe validation result that excludes user data
export interface SafeValidationResult {
  valid: boolean;
  role: UserRole | null;
  // Deliberately excludes: user object
}

// Safe config for admin responses (excludes actual UUIDs)
export interface SafeAdminConfig {
  configExists: boolean;
  // Deliberately excludes: adminUuid, dashboardUuid
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
    hintPasswordFailures?: number; // Failed hint password attempts
    hintPasswordLockedUntil?: string; // ISO timestamp when hint password lock expires
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
  question: SafeQuestion | null;
  isLastQuestion: boolean;
  completed?: boolean;
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
  rateLimited?: boolean; // If hint password attempts are rate limited
  lockTimeRemaining?: number; // Seconds remaining in hint password lock
  error?: string;
}

export interface AnswerResponse {
  correct: boolean;
  nextQuestion?: SafeQuestion;
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
