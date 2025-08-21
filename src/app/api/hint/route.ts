import { NextRequest, NextResponse } from 'next/server';
import { DataManager } from '@/lib/dataManager';
import { ApiResponse, HintResponse, HintRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: HintRequest = await request.json();
    const { uuid, questionId, password } = body;

    if (!uuid || !questionId) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'UUID and questionId are required'
      }, { status: 400 });
    }

    // Validate user
    const validation = DataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'user' || !validation.user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid user'
      }, { status: 403 });
    }

    const questions = DataManager.getQuestions();
    
    // Find the question
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Question not found'
      }, { status: 404 });
    }

    // Check if hints exist
    if (!question.hints || question.hints.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'No hints available for this question'
      }, { status: 404 });
    }

    const hintPassword = question.hintPassword;

    // Check if hints require password
    if (hintPassword && hintPassword.trim() !== '') {
      if (!password || password !== hintPassword) {
        const response: HintResponse = {
          success: false,
          requiresPassword: true,
          error: 'Incorrect password or password required'
        };
        
        return NextResponse.json<ApiResponse<HintResponse>>({
          success: true,
          data: response
        });
      }
    }

    // Return all hints
    const response: HintResponse = {
      success: true,
      hints: question.hints,
      requiresPassword: false
    };

    return NextResponse.json<ApiResponse<HintResponse>>({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Hint fetch error:', error);
    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
