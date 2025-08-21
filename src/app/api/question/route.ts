import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
import { ApiResponse, QuestionResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uuid = searchParams.get('uuid');

    if (!uuid) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID parameter is required'
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
    const questions = await HybridDataManager.getQuestions();
    
    // Find current question
    const currentQuestion = questions.find(q => q.order === user.currentQuestion);
    
    if (!currentQuestion) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No more questions available'
      }, { status: 404 });
    }

    const response: QuestionResponse = {
      question: currentQuestion,
      isLastQuestion: user.currentQuestion >= questions.length,
      progress: {
        current: user.currentQuestion,
        total: questions.length,
        percentage: Math.round((user.completedQuestions.length / questions.length) * 100)
      }
    };

    return NextResponse.json<ApiResponse<QuestionResponse>>({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Question fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
