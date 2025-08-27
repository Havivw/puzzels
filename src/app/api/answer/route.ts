import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, AnswerResponse, AnswerRequest, SafeQuestion } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: AnswerRequest = await request.json();
    const { uuid, questionId, answer } = body;

    if (!uuid || !questionId || !answer) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID, questionId, and answer are required'
      }, { status: 400 });
    }

    // Validate user
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'user' || !validation.user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid user'
      }, { status: 403 });
    }

    const user = validation.user;
    
    // Check answer rate limit before processing answer
    const rateLimitCheck = await HybridDataManager.checkRateLimit(uuid);
    if (rateLimitCheck.rateLimited) {
      const response: AnswerResponse = {
        correct: false,
        rateLimited: true,
        lockTimeRemaining: rateLimitCheck.lockTimeRemaining,
        progress: {
          current: user.currentQuestion,
          total: 0, // Will be updated below
          percentage: 0 // Will be updated below
        }
      };
      
      const questions = await HybridDataManager.getQuestions();
      response.progress.total = questions.length;
      response.progress.percentage = Math.round((user.completedQuestions.length / questions.length) * 100);
      
      return NextResponse.json<ApiResponse<AnswerResponse>>({
        success: true,
        data: response
      });
    }

    // Note: Hint password rate limiting is independent from answer rate limiting
    // Users can still submit answers even if they're locked out of hints
    
    const questions = await HybridDataManager.getQuestions();
    
    // Find the question
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Question not found'
      }, { status: 404 });
    }

    // Check answer (case insensitive)
    const isCorrect = answer.toLowerCase().trim() === question.answer.toLowerCase().trim();
    
    let response: AnswerResponse;

    if (isCorrect) {
      // Update user progress
      const updateSuccess = await HybridDataManager.updateUserProgress(uuid, questionId);
      
      if (!updateSuccess) {
        return NextResponse.json<ApiResponse<null>>({
          success: false,
          error: 'Failed to update progress'
        }, { status: 500 });
      }

      // Get next question
      const nextQuestionOrder = user.currentQuestion + 1;
      const nextQuestion = questions.find(q => q.order === nextQuestionOrder);
      
      // Filter sensitive data from next question
      const safeNextQuestion: SafeQuestion | undefined = nextQuestion ? {
        id: nextQuestion.id,
        text: nextQuestion.text,
        order: nextQuestion.order
      } : undefined;
      
      response = {
        correct: true,
        nextQuestion: safeNextQuestion,
        completed: !nextQuestion,
        progress: {
          current: nextQuestionOrder,
          total: questions.length,
          percentage: Math.round(((user.completedQuestions.length + 1) / questions.length) * 100)
        }
      };
    } else {
      // Handle incorrect answer and update failure count
      const rateLimitResult = await HybridDataManager.updateUserFailure(uuid);
      
      response = {
        correct: false,
        rateLimited: rateLimitResult.rateLimited,
        lockTimeRemaining: rateLimitResult.lockTimeRemaining,
        progress: {
          current: user.currentQuestion,
          total: questions.length,
          percentage: Math.round((user.completedQuestions.length / questions.length) * 100)
        }
      };
    }

    return NextResponse.json<ApiResponse<AnswerResponse>>({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Answer submission error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
