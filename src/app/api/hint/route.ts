import { NextRequest, NextResponse } from 'next/server';
import { HybridDataManager } from '@/lib/hybridDataManager';
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
    const validation = await HybridDataManager.validateUser(uuid);
    if (!validation.valid || validation.role !== 'user' || !validation.user) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid user'
      }, { status: 403 });
    }

    // Check hint password rate limit
    const hintRateLimitCheck = await HybridDataManager.checkHintPasswordRateLimit(uuid);
    if (hintRateLimitCheck.rateLimited) {
      const response: HintResponse = {
        success: false,
        requiresPassword: true,
        rateLimited: true,
        lockTimeRemaining: hintRateLimitCheck.lockTimeRemaining,
        error: 'Too many failed password attempts. Please wait before trying again.'
      };
      
      return NextResponse.json<ApiResponse<HintResponse>>({
        success: true,
        data: response
      });
    }

    const questions = await HybridDataManager.getQuestions();
    
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
        // Update hint password failure count
        const rateLimitResult = await HybridDataManager.updateHintPasswordFailure(uuid);
        
        const response: HintResponse = {
          success: false,
          requiresPassword: true,
          rateLimited: rateLimitResult.rateLimited,
          lockTimeRemaining: rateLimitResult.lockTimeRemaining,
          error: rateLimitResult.rateLimited 
            ? 'Too many failed password attempts. Account locked temporarily.'
            : 'Incorrect password or password required'
        };
        
        return NextResponse.json<ApiResponse<HintResponse>>({
          success: true,
          data: response
        });
      } else {
        // Reset hint password failures on successful password
        await HybridDataManager.resetHintPasswordFailures(uuid);
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
