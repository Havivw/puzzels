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

    const user = validation.user;

    // SECURITY: Check if user is trying to access hints for their current question only
    console.log('[HINT_API] User current question:', user.currentQuestion, 'Requested question:', questionId);
    if (questionId !== `q${user.currentQuestion}`) {
      console.log('[HINT_API] SECURITY VIOLATION: User tried to access hints for unauthorized question');
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: 'You can only access hints for your current question'
      }, { status: 403 });
    }

    // Check hint password rate limit
    console.log('[HINT_API] Checking hint password rate limit for user:', uuid);
    const hintRateLimitCheck = await HybridDataManager.checkHintPasswordRateLimit(uuid);
    console.log('[HINT_API] Rate limit check result:', hintRateLimitCheck);
    
    if (hintRateLimitCheck.rateLimited) {
      console.log('[HINT_API] User is rate limited, returning error');
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
      if (!password) {
        // No password provided - just request password, don't count as failure
        const response: HintResponse = {
          success: false,
          requiresPassword: true,
          rateLimited: false,
          error: 'Password required to access hints'
        };
        
        return NextResponse.json<ApiResponse<HintResponse>>({
          success: true,
          data: response
        });
      } else if (password !== hintPassword) {
        // Password provided but incorrect - count as failure
        console.log('[HINT_API] Incorrect password provided, updating failure count for user:', uuid);
        const rateLimitResult = await HybridDataManager.updateHintPasswordFailure(uuid);
        console.log('[HINT_API] Rate limit update result:', rateLimitResult);
        
        const response: HintResponse = {
          success: false,
          requiresPassword: true,
          rateLimited: rateLimitResult.rateLimited,
          lockTimeRemaining: rateLimitResult.lockTimeRemaining,
          error: rateLimitResult.rateLimited 
            ? 'Too many failed password attempts. Account locked temporarily.'
            : 'Incorrect password'
        };
        
        return NextResponse.json<ApiResponse<HintResponse>>({
          success: true,
          data: response
        });
      } else {
        // Correct password - reset failures and show hints
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
